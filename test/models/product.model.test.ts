import mongoose from "mongoose";
import { Product } from "../../src/models/product.model";

describe("Product Model", () => {

    // ================================
    // CONNECT DB
    // ================================
    beforeAll(async () => {
        await mongoose.connect("mongodb://127.0.0.1:27017/test_db");
    });

    // ================================
    // CLEANUP DB
    // ================================
    afterAll(async () => {
        await mongoose.connection.db?.dropDatabase();
        await mongoose.disconnect();
    });

    // ================================
    // SUCCESS CASE
    // ================================
    it("should create product successfully", async () => {
        const product = await Product.create({
            name: "Laptop",
            price: 50000,
        });

        expect(product._id).toBeDefined();
        expect(product.name).toBe("Laptop");
        expect(product.price).toBe(50000);
    });

    // ================================
    // VALIDATION - MISSING NAME
    // ================================
    it("should fail if name is missing", async () => {
        try {
            await Product.create({
                price: 1000,
            } as any);

            // force fail if no error thrown
            throw new Error("Test failed - validation did not run");
        } catch (err: any) {
            expect(err.errors.name).toBeDefined();
        }
    });

    // ================================
    // VALIDATION - MISSING PRICE
    // ================================
    it("should fail if price is missing", async () => {
        try {
            await Product.create({
                name: "Phone",
            } as any);

            throw new Error("Test failed - validation did not run");
        } catch (err: any) {
            expect(err.errors.price).toBeDefined();
        }
    });
});