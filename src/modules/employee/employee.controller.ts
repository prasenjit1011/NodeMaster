import { FastifyRequest, FastifyReply } from 'fastify';
import { EmployeeService } from './employee.service';

const service = new EmployeeService();

export class EmployeeController {

  async create(req: FastifyRequest, reply: FastifyReply) {
    const data = await service.create(req.body);
    reply.send(data);
  }

  async getAll(req: FastifyRequest, reply: FastifyReply) {
  const { page = 1, limit = 5 } = req.query as any;

  const result = await service.getAll(Number(page), Number(limit));

  const empData = {
    page: Number(page),
    limit: Number(limit),
    ...result
  };

  console.log('=========== empData =======================');
  console.log(empData);

  return empData; // ✅ better than reply.send
}

  async getById(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as any;
    const data = await service.getById(Number(id));
    reply.send(data);
  }

  async update(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as any;
    const data = await service.update(Number(id), req.body);
    reply.send(data);
  }

  async delete(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as any;
    const data = await service.delete(Number(id));
    reply.send(data);
  }
}