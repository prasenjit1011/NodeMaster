import request from "supertest";
import express from "express";
import productRoutes from "../../src/routes/product.routes";
import { createProduct, getProducts } from "../../src/controllers/product.controller";

// ================================
// MOCK CONTROLLERS
// ================================
jest.mock("../../src/controllers/product.controller", () => ({
    createProduct: jest.fn((req, res) => {
        res.status(201).json({
            success: true,
            message: "Product Created",
            data: req.body,
        });
    }),

    getProducts: jest.fn((req, res) => {
        res.status(200).json({
            success: true,
            data: [
                { id: 1, name: "Product 1" },
                { id: 2, name: "Product 2" },
            ],
        });
    }),
}));

// ================================
// EXPRESS APP SETUP
// ================================
const app = express();
app.use(express.json());
app.use("/products", productRoutes);

// ================================
// TEST SUITE
// ================================
describe("Product Routes", () => {

    // =========================
    // GET /products
    // =========================
    it("GET /products should return all products", async () => {
        const res = await request(app).get("/products");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBe(2);
    });

    // =========================
    // POST /products
    // =========================
    it("POST /products should create a product", async () => {
        const newProduct = {
            name: "Laptop",
            price: 50000,
        };

        const res = await request(app)
            .post("/products")
            .send(newProduct);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe("Laptop");
    });
});