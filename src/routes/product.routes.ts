import express from "express";
import { createProduct, getProducts } from "../controllers/product.controller";

const router = express.Router();

// POST /products
router.post("/", createProduct);

// GET /products
router.get("/", getProducts);

export default router;