import dotenv from "dotenv";
dotenv.config(); // MUST be first

import express, { Request, Response, NextFunction } from "express";
import os from "os";
import axios from "axios";
import { connectDB } from "./config/db";
import productRoutes from "./routes/product.routes";
import itemRoutes from "./routes/item.routes";


// console.clear();
console.log("\n\n-: App Started :-");
// ================================
// Uncaught Exception
// ================================
process.on('uncaughtException', (err: Error) => {
    console.error('Uncaught Exception:', err.message);
    process.exit(1);
});


// ================================
// Express App
// ================================
const app = express();
app.use(express.json());

// ================================
// Item and Product Routes
// ================================
app.use('/items', itemRoutes);
app.use("/products", productRoutes);


/**
 * Get Local Machine / VM IP
 */
const getLocalIP = (): string[] => {
    const nets = os.networkInterfaces();
    const results: string[] = [];

    for (const name of Object.keys(nets)) {
        for (const net of nets[name] || []) {
            if (net.family === "IPv4" && !net.internal) {
                results.push(net.address);
            }
        }
    }

    return results;
};

/**
 * Get Public IP (External)
 */
const getPublicIP = async (): Promise<string> => {
    const res = await axios.get("https://api.ipify.org?format=json");
    return res.data.ip;
};

app.use('/server', async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('-: Welcome GCP Terraform Items CRUD with MongoDB :-');

        // -----------------------------
        // Local / VM IP
        // -----------------------------
        const localIPs = getLocalIP();

        // -----------------------------
        // Client IP (behind LB safe)
        // -----------------------------
        const clientIP =
            (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
            req.socket.remoteAddress ||
            "unknown";

        // -----------------------------
        // Public Server IP
        // -----------------------------
        const publicIP = await getPublicIP();

        // -----------------------------
        // GCP / VM Context (basic)
        // -----------------------------
        const gcpContext = {
            nodeEnv: process.env.NODE_ENV || "development",
            region: process.env.GCP_REGION || "unknown",
            instanceName: process.env.GCE_INSTANCE_NAME || "unknown",
            projectId: process.env.GCP_PROJECT_ID || "unknown",
        };

        // -----------------------------
        // Response JSON
        // -----------------------------
        res.status(200).json({
            message: "-: Welcome To GCP Terraform 001 :-",
            timestamp: new Date().toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
            }),

            ipDetails: {
                localServerIP: localIPs,
                clientIP: clientIP,
                publicServerIP: publicIP,
            },

            gcpContext: gcpContext,
        });
    }
    catch (err) {
        next(err);
    }
});





// ================================
// About Route
// ================================
app.use('/about', (req: Request, res: Response, next: NextFunction) => {
    try {

        console.log('-: Welcome to About GCP Page :-');

        // Test Sync Error
        // throw new Error('About Page Error');
        res.status(200).send('-: Welcome to About Me Page :- '+new Date().toLocaleString('en-IN', {timeZone: 'Asia/Kolkata'}))

    }
    catch (err) {
        next(err);
    }
});


// ================================
// Home Route
// ================================
app.use('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('-: Welcome GCP TerraForm Items CRUD with MOngoDB :-');
        // Test Promise Rejection
        // await Promise.reject(new Error('Promise Rejection Error'));
        res.status(200).send('-: Welcome To GCP TeraForm 001 :-'+new Date().toLocaleString('en-IN', {timeZone: 'Asia/Kolkata'}));
    }
    catch (err) {
        next(err);
    }
});


// ================================
// 404 Route
// ================================
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Route Not Found'
    });
});


// ================================
// Centralized Error Handler
// ================================
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Central Error Handler:', err.message);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});


// ================================
// Start Server
// ================================
const startServer = async () => {
    await connectDB(); // 🔥 MongoDB connects first

    const server = app.listen(3000, "0.0.0.0", () => {
        console.log("-: App Running :-");
        console.log("Server running on port 3000");
    });

    // Unhandled Promise Rejection
    process.on("unhandledRejection", (reason: any) => {
        console.error("Unhandled Promise Rejection:", reason);
        server.close(() => process.exit(1));
    });
};

startServer();


// ================================
// Unhandled Promise Rejection
// ================================
process.on('unhandledRejection', (reason: any) => {
    console.error('Unhandled Promise Rejection:', reason);
    server.close(() => {
        process.exit(1);
    });
});