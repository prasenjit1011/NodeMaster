import { OrderController } from './order.controller';
import { verifyToken } from '../../middleware/auth.middleware';

export default async function orderRoutes(fastify: any) {
  const controller = new OrderController();

  fastify.get('/orders', controller.getAll.bind(controller));
  fastify.get('/orders/:id', controller.getById.bind(controller));
  fastify.post('/orders', { preHandler: [verifyToken] }, controller.create.bind(controller));
}