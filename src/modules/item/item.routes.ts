import { FastifyInstance } from "fastify";
import { ItemController } from "./item.controller";
// import { authMiddleware } from "../auth/auth.middleware";
import {
  validateCreateItem,
  validateUpdateItem,
  validateId,
} from "./item.validation";

export default async function itemRoutes(app: FastifyInstance) {
  
  // ✅ GET all items
  app.get("/", ItemController.getAll);

  // ✅ GET item by ID
  app.get(
    "/:id",
    { preHandler: [validateId] },
    ItemController.getById
  );

  // ✅ CREATE item without authMiddleware
  app.post(
    "/",
    { preHandler: [validateCreateItem] },
    ItemController.create
  );

  // ✅ UPDATE item
  app.put(
    "/:id",
    { preHandler: [validateUpdateItem] },
    ItemController.update
  );

  // ✅ DELETE item
  app.delete(
    "/:id",
    { preHandler: [validateId] },
    ItemController.delete
  );
}