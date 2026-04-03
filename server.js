import express from "express";
import http from "http";
import { Server } from "socket.io";
import { createClient } from "redis";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(express.json());

// Redis Clients
const pub = createClient();
const sub = createClient();

await pub.connect();
await sub.connect();

// 🔔 Subscriber → Send to React via WebSocket
await sub.subscribe("notifications", (message) => {
  const data = JSON.parse(message);
  console.log("Received from Redis:", data);

  io.emit("notification", data);
});

// 🌐 API → Publish Notification
app.post("/notify", async (req, res) => {
  const notification = {
    userId: req.body.userId || 1,
    title: req.body.title || "New Notification",
    message: req.body.message || "Hello from API",
    time: new Date(),
  };

  await pub.publish("notifications", JSON.stringify(notification));

  res.json({ success: true, notification });
});

server.listen(3000, () => {
  console.log("🚀 Backend running on http://localhost:3000");
});