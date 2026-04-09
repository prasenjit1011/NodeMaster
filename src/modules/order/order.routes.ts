import { OrderController } from './order.controller';
import { authMiddleware } from '../auth/auth.middleware';

export default async function orderRoutes(fastify: any) {
  const controller = new OrderController();

  fastify.get('/orders', controller.getAll.bind(controller));
  fastify.get('/orders/:id', controller.getById.bind(controller));
  fastify.post('/orders', { preHandler: authMiddleware },controller.create.bind(controller));
}