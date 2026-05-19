import request from "supertest";
import express from "express";
import fs from "fs-extra";
import itemRoutes from "../../src/routes/item.routes";

// ================================
// MOCK fs-extra
// ================================
jest.mock("fs-extra");

// Strong mock typing (prevents TS issues)
const mockedFs = fs as unknown as {
    readFile: jest.Mock;
    writeFile: jest.Mock;
};

// ================================
// Express App Setup
// ================================
const app = express();
app.use(express.json());
app.use("/items", itemRoutes);

// ================================
// Mock Data
// ================================
let mockItems: any[] = [];

beforeEach(() => {
    jest.clearAllMocks();

    mockItems = [
        { id: 1, name: "Item One" },
        { id: 2, name: "Item Two" },
    ];

    mockedFs.readFile.mockResolvedValue(
        JSON.stringify(mockItems)
    );

    mockedFs.writeFile.mockResolvedValue(undefined);
});

// ================================
// TEST SUITE
// ================================
describe("Item Routes API", () => {

    // =========================
    // GET ALL ITEMS
    // =========================
    it("GET /items should return all items", async () => {
        const res = await request(app).get("/items");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBe(2);
    });

    // =========================
    // GET SINGLE ITEM
    // =========================
    it("GET /items/:id should return single item", async () => {
        const res = await request(app).get("/items/1");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBe(1);
    });

    // =========================
    // GET NOT FOUND
    // =========================
    it("GET /items/:id should return 404 if not found", async () => {
        const res = await request(app).get("/items/999");

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Item Not Found");
    });

    // =========================
    // CREATE ITEM
    // =========================
    it("POST /items should create item", async () => {
        const res = await request(app)
            .post("/items")
            .send({ name: "New Item" });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe("New Item");

        expect(mockedFs.writeFile).toHaveBeenCalled();
    });

    // =========================
    // UPDATE ITEM
    // =========================
    it("PUT /items/:id should update item", async () => {
        const res = await request(app)
            .put("/items/1")
            .send({ name: "Updated Item" });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe("Updated Item");

        expect(mockedFs.writeFile).toHaveBeenCalled();
    });

    // =========================
    // UPDATE NOT FOUND
    // =========================
    it("PUT /items/:id should return 404 if not found", async () => {
        const res = await request(app)
            .put("/items/999")
            .send({ name: "Test" });

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Item Not Found");
    });

    // =========================
    // DELETE ITEM
    // =========================
    it("DELETE /items/:id should delete item", async () => {
        const res = await request(app).delete("/items/1");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("Item Deleted");

        expect(mockedFs.writeFile).toHaveBeenCalled();
    });
});