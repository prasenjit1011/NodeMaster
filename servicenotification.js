// Build a small backend service that accepts notification requests (email, sms, push) through an API endpoint. 
// The system should ensure that the same user does not receive more than 3 notifications of the same type within 1 minute.
// Requirements:
// Expose an API endpoint to accept notification requests.
// Maintain rate-limiting logic in memory.
// Return appropriate success/error responses.
// Structure the code cleanly with separation of controller/service layers.


const express = require("express");

const app = express();

app.use(express.json());

// In-memory notification store
const notificationStore = {};

// Config
const LIMIT = 3;
const WINDOW_SIZE = 60 * 1000; // 1 minute

// Service Layer
const notificationService = {
  processNotification: ({ userId, type, message }) => {
    const allowedTypes = ["email", "sms", "push"];

    // Validate notification type
    if (!allowedTypes.includes(type)) {
      return {
        success: false,
        statusCode: 400,
        message: "Invalid notification type",
      };
    }

    const key = `${userId}-${type}`;
    const currentTime = Date.now();

    // Initialize array
    if (!notificationStore[key]) {
      notificationStore[key] = [];
    }

    // Remove old timestamps
    notificationStore[key] = notificationStore[key].filter(
      (timestamp) => currentTime - timestamp < WINDOW_SIZE
    );

    // Check rate limit
    if (notificationStore[key].length >= LIMIT) {
      return {
        success: false,
        statusCode: 429,
        message:
          "Rate limit exceeded. Max 3 notifications of same type per minute allowed.",
      };
    }

    // Store current request timestamp
    notificationStore[key].push(currentTime);

    // Simulate notification sending
    console.log(`
      Notification Sent
      -----------------
      User ID : ${userId}
      Type    : ${type}
      Message : ${message}
    `);

    return {
      success: true,
      statusCode: 200,
      message: `${type} notification sent successfully`,
    };
  },
};

// Controller Layer
app.post("/api/notifications", (req, res) => {
  try {
    const { userId, type, message } = req.body;

    // Validation
    if (!userId || !type || !message) {
      return res.status(400).json({
        success: false,
        message: "userId, type, and message are required",
      });
    }

    const result = notificationService.processNotification({
      userId,
      type,
      message,
    });

    return res.status(result.statusCode).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

// Health check
app.get("/", (req, res) => {
  res.send("Notification Service Running...");
});

// Start server
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});