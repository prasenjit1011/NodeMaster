import { FastifyInstance } from 'fastify';
import { EmployeeController } from './employee.controller';

export async function employeeRoutes(app: FastifyInstance) {
  const controller = new EmployeeController();

  app.post('/', controller.create);
  app.get('/', controller.getAll);
  app.get('/:id', controller.getById);
  app.put('/:id', controller.update);
  app.delete('/:id', controller.delete);
}