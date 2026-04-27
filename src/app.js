console.clear();
console.log('\n\n-: App Started :-');

const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(express.json());

// Import Routes
const userRoutes = require('./modules/users/users.routes');

// MongoDB Connection
const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/mydb";

mongoose.connect(MONGO_URL)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ DB Error:", err));

// Home Route
app.get('/', (req, res) => {
  res.send("🚀 Server running with MongoDB");
});

// Use Routes
app.use('/users', userRoutes);

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('Central Error Handler:', err.message);
  res.status(500).json({
    message: 'Internal Server Error',
    error: err.message
  });
});

// Start Server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});