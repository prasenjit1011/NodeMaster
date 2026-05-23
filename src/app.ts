import dotenv from "dotenv";
dotenv.config(); // MUST be first


console.clear();
console.log('\n\n-: App Started :-');
import { connectDB } from "./config/db";

const express = require('express');
const app = express();

app.use('/about', (req, res) => {
    console.log('-: Welcome :-');
    res.send('-: Welcome About Page :-');
});


app.use('/', (req, res) => {
    const dtd = new Date().toLocaleString();
    const mongoURI = process.env.MONGO_URI || process.env.MONGO_URL || process.env.MONGODB_URI;
    console.log('-: Welcome :-');
    res.send('-: Welcome ||| ' + mongoURI + ' | '+dtd);
});

// Centralized Error Handler
app.use((err, req, res, next) => {
    console.error('Central Error Handler:', err.message);
    res.status(500).json({
        message: 'Internal Server Error',
        error: err.message
    });
});

console.log('-: App Running :-');




// ================================
// START SERVER (FIXED SCOPE)
// ================================
let server: any;

const startServer = async () => {
    await connectDB();

    server = app.listen(3000, "0.0.0.0", () => {
        console.log("-: App Running :-");
        console.log("Server running on port 3000");
    });
};

startServer();