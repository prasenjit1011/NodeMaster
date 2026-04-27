console.clear();
console.log('\n\n-: App Started :-');

import express, { Request, Response } from "express";
import { NextFunction } from "express-serve-static-core";
import mongoose from "mongoose";
import dotenv from "dotenv";

import userRoutes from './modules/users/users.routes';
import productRoutes from './modules/products/product.routes';
import orderRoutes from './modules/orders/order.routes';
dotenv.config();

const app = express();
const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/mydb";
mongoose.connect(MONGO_URL)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ DB Error:", err));

app.use(express.json());
app.use('/users', userRoutes);
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send("🚀 Server running with MongoDB...");
});


// Central Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
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