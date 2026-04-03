import { createClient } from "redis";

// Config (you can move to .env if needed)
const REDIS_CONFIG = {
  socket: {
    host: "127.0.0.1",
    port: 6379,
  },
};

const CHANNEL = "notifications";

// Create Publisher
const publisher = createClient(REDIS_CONFIG);

// Create Subscriber
const subscriber = createClient(REDIS_CONFIG);

// Error handling
publisher.on("error", (err) => console.error("Publisher Error:", err));
subscriber.on("error", (err) => console.error("Subscriber Error:", err));

async function startApp() {
  // Connect both clients
  await publisher.connect();
  await subscriber.connect();

  console.log("✅ Redis connected");

  // Start Subscriber
  await subscriber.subscribe(CHANNEL, (message) => {
    const data = JSON.parse(message);

    console.log("\n🔔 Notification Received:");
    console.log("User:", data.userId);
    console.log("Title:", data.title);
    console.log("Message:", data.message);
    console.log("Time:", data.timestamp);
    console.log("-----------------------------");
  });

  console.log("📡 Subscribed to channel:", CHANNEL);

  // Simulate publishing every 5 seconds
  setInterval(async () => {
    const notification = {
      userId: Math.floor(Math.random() * 1000),
      title: "New Event",
      message: "You have a new notification!",
      timestamp: new Date(),
    };

    await publisher.publish(CHANNEL, JSON.stringify(notification));

    console.log("\n📤 Notification Sent:", notification);
  }, 5000);
}

startApp();