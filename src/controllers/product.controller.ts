import { Request, Response } from "express";
import { Product } from "../models/product.model";

// CREATE product
export const createProduct = async (req: Request, res: Response) => {
    try {
        const { name, price } = req.body;

        const product = await Product.create({ name, price });

        res.status(201).json({
            success: true,
            message: "Product created",
            data: product
        });
    } catch (err: any) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// GET all products
export const getProducts = async (req: Request, res: Response) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (err: any) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};