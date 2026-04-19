import { FastifyRequest, FastifyReply } from "fastify";
import { EmployeeService } from "./employee.service";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeIdSchema,
} from "./employee.schema";

const service = new EmployeeService();

export class EmployeeController {
  async create(req: FastifyRequest, reply: FastifyReply) {
    // ✅ validate body
    const validatedBody = createEmployeeSchema.parse(req.body);

    const data = await service.create(validatedBody);
    return reply.send(data);
  }

  async getAll(req: FastifyRequest, reply: FastifyReply) {
    const { page = 1, limit = 5 } = req.query as {
      page?: number;
      limit?: number;
    };

    const result = await service.getAll(Number(page), Number(limit));

    return reply.send({
      page: Number(page),
      limit: Number(limit),
      ...result,
    });
  }

  async getById(req: FastifyRequest, reply: FastifyReply) {
    // ✅ validate params
    const { id } = employeeIdSchema.parse(req.params);

    const data = await service.getById(id);
    return reply.send(data);
  }

  async update(req: FastifyRequest, reply: FastifyReply) {
    // ✅ validate params + body
    const { id } = employeeIdSchema.parse(req.params);
    const validatedBody = updateEmployeeSchema.parse(req.body);

    const data = await service.update(id, validatedBody);
    return reply.send(data);
  }

  async delete(req: FastifyRequest, reply: FastifyReply) {
    // ✅ validate params
    const { id } = employeeIdSchema.parse(req.params);

    const data = await service.delete(id);
    return reply.send(data);
  }
}