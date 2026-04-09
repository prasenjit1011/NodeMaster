// controllers/item.controller.ts

import { FastifyRequest, FastifyReply } from "fastify";
import { ItemService } from "./item.service";

const service = new ItemService();

// 🔹 Define types for params & body
type IdParams = {
  id: string;
};

type ItemBody = {
  name: string;
  price: number;
};

export class ItemController {

  static async getAll(
    _request: FastifyRequest,
    reply: FastifyReply
  ) {
    const data = await service.getAllItems();
    return reply.send(data);
  }

  static async getById(
    request: FastifyRequest<{ Params: IdParams }>,
    reply: FastifyReply
  ) {
    const item = await service.getItem(Number(request.params.id));

    if (!item) {
      return reply.code(404).send({ message: "Not found" });
    }

    return reply.send(item);
  }

  static async create(
    request: FastifyRequest<{ Body: ItemBody }>,
    reply: FastifyReply
  ) {
    const item = await service.createItem(request.body);
    return reply.code(201).send({...item, id: Number(item.id)});
  }

  static async update(
    request: FastifyRequest<{ Params: IdParams; Body: Partial<ItemBody> }>,
    reply: FastifyReply
  ) {
    const success = await service.updateItem(
      Number(request.params.id),
      request.body
    );

    if (!success) {
      return reply.code(404).send({ message: "Not found" });
    }

    return reply.send({ message: "Updated" });
  }

  static async delete(
    request: FastifyRequest<{ Params: IdParams }>,
    reply: FastifyReply
  ) {
    const success = await service.deleteItem(
      Number(request.params.id)
    );

    if (!success) {
      return reply.code(404).send({ message: "Not found" });
    }

    return reply.send({ message: "Deleted" });
  }
}