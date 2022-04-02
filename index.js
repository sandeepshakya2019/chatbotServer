// Installing Required Dependency
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const cors = require("cors");

// Requireing som eother files like router, users
const router = require("./Router/router");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./Users/users");

// Initializing the express App
const app = express();

// For CORS
app.use(cors());
//For routing files
app.use(router);

// Create HTTP Server
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 5000;

io.on("connect", (socket) => {
  socket.on("join", ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });

    if (error) return callback(error);
    // Join user in the room
    socket.join(user.room);
    // Emitt the admin msg
    socket.emit("message", {
      user: "admin",
      text: `${user.name}, welcome to room ${user.room}.`,
    });

    // broadcast msg
    socket.broadcast
      .to(user.room)
      .emit("message", { user: "admin", text: `${user.name} has joined!` });
    // to emit the room data
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    // emit the event to send the user message
    io.to(user.room).emit("message", { user: user.name, text: message });

    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit("message", {
        user: "Admin",
        text: `${user.name} has left.`,
      });
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

server.listen(port, () => console.log(`Server has started on PORT ${port}`));
