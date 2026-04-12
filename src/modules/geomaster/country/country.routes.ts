import { FastifyInstance } from "fastify";
import { CountryController } from "./country.controller";
import {
  validateCreateCountry,
  validateUpdateCountry,
  validateId,
} from "./country.validation";

export default async function countryRoutes(app: FastifyInstance) {

  // ✅ GET all countries
  app.get("/", CountryController.getAll);

  // ✅ GET country by ID
  app.get(
    "/:id",
    { preHandler: [validateId] },
    CountryController.getById
  );

  // ✅ CREATE country
  app.post(
    "/",
    { preHandler: [validateCreateCountry] },
    CountryController.create
  );

  // ✅ UPDATE country
  app.put(
    "/:id",
    { preHandler: [validateUpdateCountry] },
    CountryController.update
  );

  // ✅ DELETE country
  app.delete(
    "/:id",
    { preHandler: [validateId] },
    CountryController.delete
  );
}