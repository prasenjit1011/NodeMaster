import { FastifyInstance } from "fastify";
import { ItemController } from "../controllers/item.controller";
import {
  validateCreateItem,
  validateUpdateItem,
  validateId,
} from "../middleware/item.validation";

export default async function itemRoutes(app: FastifyInstance) {
  
  // ✅ GET all items
  app.get("/", ItemController.getAll);

  // ✅ GET item by ID
  app.get(
    "/:id",
    { preHandler: [validateId] },
    ItemController.getById
  );

  // ✅ CREATE item
  app.post(
    "/",
    { preHandler: [validateCreateItem] },
    ItemController.create
  );

  // ✅ UPDATE item
  app.put(
    "/:id",
    { preHandler: [validateId, validateUpdateItem] },
    ItemController.update
  );

  // ✅ DELETE item
  app.delete(
    "/:id",
    { preHandler: [validateId] },
    ItemController.delete
  );
}