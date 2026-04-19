import { ZodSchema } from "zod";
import { FastifyRequest } from "fastify";

export const validateBody = (schema: ZodSchema, body: any) => {
  return schema.parse(body);
};

export const validateQuery = (schema: ZodSchema, query: any) => {
  return schema.parse(query);
};

export const validateParams = (schema: ZodSchema, params: any) => {
  return schema.parse(params);
};