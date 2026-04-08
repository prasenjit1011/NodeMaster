import { buildApp } from "../app";
import request from "supertest";

describe("Item API", () => {
  const app = buildApp();

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  let itemId: number;

  it("should create item", async () => {
    const res = await request(app.server)
      .post("/items")
      .send({
        name: "Test Item",
        price: 100
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe("Test Item");

    itemId = Number(res.body.id);
  });

  it("should get all items", async () => {
    const res = await request(app.server).get("/items");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("should get item by id", async () => {
    const res = await request(app.server).get(`/items/${itemId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(itemId);
  });

  it("should update item", async () => {
    const res = await request(app.server)
      .put(`/items/${itemId}`)
      .send({ name: "Updated Item" });

    expect(res.statusCode).toBe(200);
  });

  it("should delete item", async () => {
    const res = await request(app.server)
      .delete(`/items/${itemId}`);

    expect(res.statusCode).toBe(200);
  });
});