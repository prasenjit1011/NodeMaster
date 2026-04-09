import { FastifyRequest, FastifyReply } from "fastify";

// Types
type IdParams = {
  id: string;
};

type CreateItemBody = {
  name: string;
  price: number;
};

type UpdateItemBody = {
  name?: string;
  price?: number;
};

// ✅ Validate ID param
export const validateId = async (
  request: FastifyRequest<{ Params: IdParams }>,
  reply: FastifyReply
) => {
  const id = Number(request.params.id);

  if (isNaN(id) || id <= 0) {
    return reply.status(400).send({
      error: "Invalid ID",
    });
  }
};

// ✅ Create validation
export const validateCreateItem = async (
  request: FastifyRequest<{ Body: CreateItemBody }>,
  reply: FastifyReply
) => {
  const { name, price } = request.body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return reply.status(400).send({
      error: "Name is required and must be a non-empty string",
    });
  }

  if (price === undefined || typeof price !== "number") {
    return reply.status(400).send({
      error: "Price is required and must be a number",
    });
  }

  if (price <= 0) {
    return reply.status(400).send({
      error: "Price must be greater than 0",
    });
  }
};

// ✅ Update validation
export const validateUpdateItem = async (
  request: FastifyRequest<{ Body: UpdateItemBody }>,
  reply: FastifyReply
) => {
  const { name, price } = request.body;

  if (name === undefined && price === undefined) {
    return reply.status(400).send({
      error: "At least one field (name or price) is required",
    });
  }

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim() === "") {
      return reply.status(400).send({
        error: "Name must be a non-empty string",
      });
    }
  }

  if (price !== undefined) {
    if (typeof price !== "number") {
      return reply.status(400).send({
        error: "Price must be a number",
      });
    }

    if (price <= 0) {
      return reply.status(400).send({
        error: "Price must be greater than 0",
      });
    }
  }
};