const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const amqp = require('amqplib');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// RabbitMQ setup
let channel;
const QUEUE = "notifications";

async function connectRabbitMQ() {
  const connection = await amqp.connect('amqp://localhost');
  channel = await connection.createChannel();

  await channel.assertQueue(QUEUE, { durable: false });

  // Consumer
  channel.consume(QUEUE, (msg) => {
    if (msg !== null) {
      const data = JSON.parse(msg.content.toString());

      io.emit("notification", data);

      channel.ack(msg);
    }
  });

  console.log("RabbitMQ connected & consuming...");
}

connectRabbitMQ();

// GET API to send notification
app.get('/notify', async (req, res) => {
  const title = req.query.title || "Default Title";
  const message = req.query.message || "Default Message " + new Date().toLocaleTimeString();

  const data = { title, message, time: new Date() };

  channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(data)));

  res.send("Notification sent");
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});