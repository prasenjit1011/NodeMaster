const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const redis = require('redis');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Redis
const pub = redis.createClient();
const sub = redis.createClient();

(async () => {
  await pub.connect();
  await sub.connect();

  await sub.subscribe("notifications", (message) => {
    io.emit("notification", JSON.parse(message));
  });
})();

// GET API to send notification
app.get('/notify', async (req, res) => {
  const title = req.query.title || "Default Title";
  const message = req.query.message || "Default Message";

  const data = { title, message, time: new Date() };

  await pub.publish("notifications", JSON.stringify(data));

  res.send("Notification sent");
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});