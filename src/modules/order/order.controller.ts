import { FastifyRequest, FastifyReply } from 'fastify';
import { OrderService } from './order.service';
import { CreateOrderInput } from './order.types';

const orderService = new OrderService();

export class OrderController {

  async getAll(req: FastifyRequest, reply: FastifyReply) {
    const orders = await orderService.getAllOrders();
    reply.send(orders);
  }

  async getById(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const id = Number(req.params.id);
    const order = await orderService.getOrderById(id);

    if (!order) {
      return reply.status(404).send({ message: 'Order not found' });
    }

    reply.send(order);
  }

  async create(
    req: FastifyRequest<{ Body: CreateOrderInput }>,
    reply: FastifyReply
  ) {
    try {

      return reply.status(200).send({ message: '--HelloWorld---' });

      // 🔥 Get customer_id from token
      const user = (req as any).user;
      const customerId = user.id;

      const order = await orderService.createOrder(customerId, req.body);

      reply.status(201).send(order);
    } catch (error: any) {
      reply.status(500).send({
        message: error.message
      });
    }
  }
}