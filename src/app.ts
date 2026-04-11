import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

console.log('\n\n-: App Started :-');

dotenv.config();

const app = express();

// Middleware
app.use(express.static('images'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// CORS Headers
app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Methods',
        'OPTIONS, GET, POST, PUT, PATCH, DELETE'
    );
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization'
    );
    next();
});

// Routes
import mailRoute from './routes/mailRoute.js';
app.use(mailRoute);

// Default route
app.use('/', (_req: Request, res: Response, next: NextFunction) => {
    console.log('-: Welcome :-');
    res.send('-: Welcome :-');
    next();
});

console.log('-: App Running :-');

app.listen(3000, () => {
    console.log('Server running on port 3000');
});