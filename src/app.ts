import express, { Request, Response, NextFunction } from "express";
import itemRoutes from "./routes/item.routes";

console.clear();
console.log('\n\n-: App Started :-');

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
// Item Routes
// ================================
app.use('/items', itemRoutes);

// ================================
// About Route
// ================================
app.use('/about', (req: Request, res: Response, next: NextFunction) => {
    try {

        console.log('-: Welcome to About Me Page :-');

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
        console.log('-: Welcome GCP :-');
        // Test Promise Rejection
        // await Promise.reject(new Error('Promise Rejection Error'));
        res.status(200).send('-: Welcome GCP TeraForm :-'+new Date().toLocaleString('en-IN', {timeZone: 'Asia/Kolkata'}));
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
const server = app.listen(3000, '0.0.0.0', () => {
    console.log('-: App Running :-');
    console.log(`Server running on port 3000`);
});


// ================================
// Unhandled Promise Rejection
// ================================
process.on('unhandledRejection', (reason: any) => {
    console.error('Unhandled Promise Rejection:', reason);
    server.close(() => {
        process.exit(1);
    });
});