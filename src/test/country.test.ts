import { buildApp } from "../app";
import request from "supertest";

describe("Country API", () => {
  const app = buildApp();

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  let countryId: number;

  it("should create country", async () => {
    const res = await request(app.server)
      .post("/countries")
      .send({
        countryname: "Test Country",
        status: true
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.countryname).toBe("Test Country");
    expect(res.body.status).toBe(true);

    countryId = Number(res.body.id);
  });

  it("should get all countries", async () => {
    const res = await request(app.server).get("/countries");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("should get country by id", async () => {
    const res = await request(app.server).get(`/countries/${countryId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(countryId);
    expect(res.body.countryname).toBe("Test Country");
  });

  it("should update country", async () => {
    const res = await request(app.server)
      .put(`/countries/${countryId}`)
      .send({
        countryname: "Updated Test Country",
        status: false
      });

    expect(res.statusCode).toBe(200);
  });

  it("should reject duplicate country name on create", async () => {
    const res = await request(app.server)
      .post("/countries")
      .send({
        countryname: "Updated Test Country", // Same name as updated in previous test
        status: true
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.error).toBe("Country name already exists");
  });

  it("should reject duplicate country name on update", async () => {
    // Create another country first
    const createRes = await request(app.server)
      .post("/countries")
      .send({
        countryname: "Another Country",
        status: true
      });

    const anotherCountryId = createRes.body.id;

    // Try to update it with the same name as the first country
    const updateRes = await request(app.server)
      .put(`/countries/${anotherCountryId}`)
      .send({
        countryname: "Updated Test Country" // Same name as updated in previous test
      });

    expect(updateRes.statusCode).toBe(409);
    expect(updateRes.body.error).toBe("Country name already exists");
  });

  it("should delete country", async () => {
    const res = await request(app.server)
      .delete(`/countries/${countryId}`);

    expect(res.statusCode).toBe(200);
  });

  it("should return 404 for non-existent country", async () => {
    const res = await request(app.server).get("/countries/99999");

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Not found");
  });
});