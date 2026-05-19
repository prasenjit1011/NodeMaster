import request from "supertest";
import app from "../src/app";

describe("App Routes", () => {
    // =========================
    // HOME ROUTE
    // =========================
    it("GET / should return home message", async () => {
        const res = await request(app).get("/");

        expect(res.status).toBe(200);
        expect(res.text).toContain("Welcome To GCP Terraform Home Page");
        expect(res.text).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    // =========================
    // ABOUT ROUTE
    // =========================
    it("GET /about should return about message", async () => {
        const res = await request(app).get("/about");

        expect(res.status).toBe(200);
        expect(res.text).toContain("Welcome To GCP Terraform About Me Page");
        expect(res.text).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    // =========================
    // 404 ROUTE
    // =========================
    it("GET unknown route should return 404", async () => {
        const res = await request(app).get("/random-route");

        expect(res.status).toBe(404);
        expect(res.body).toEqual({
            success: false,
            message: "Route Not Found",
        });
    });

    // =========================
    // ERROR HANDLER TEST
    // =========================
    it("should handle errors via middleware", async () => {
        // We simulate error by hitting invalid JSON parsing
        const res = await request(app)
            .post("/products")
            .set("Content-Type", "application/json")
            .send("invalid-json"); // forces express JSON error

        // Either 400 or 500 depending on express behavior
        expect([400, 500]).toContain(res.status);
    });
});