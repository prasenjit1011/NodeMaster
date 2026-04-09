import { CreateOrderInput } from './order.types';
import { OrderRepository } from './order.repository';

export class OrderService {
  private orderRepo = new OrderRepository();

  async getAllOrders() {
    return this.orderRepo.findAll();
  }

  async getOrderById(id: number) {
    return this.orderRepo.findById(id);
  }

  async createOrder(customerId: number, data: CreateOrderInput) {
    if (!data.items || data.items.length === 0) {
      throw new Error('Order must have at least one item');
    }

    return this.orderRepo.create(customerId, data.items);
  }
}