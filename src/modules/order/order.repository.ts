import { prisma } from '../../config/db';

export class OrderRepository {
  async findAll() {
    return prisma.orders.findMany({
      include: {
        customers: true,
        order_items: true
      }
    });
  }

  async findById(id: number) {
    return prisma.orders.findUnique({
      where: { id },
      include: {
        customers: true,
        order_items: true
      }
    });
  }

  async create(customerId: number, items: any[]) {
    return prisma.orders.create({
      data: {
        customers: {
          connect: { id: customerId }
        },
        order_items: {
          create: items.map(item => ({
            item_id: item.item_id,
            quantity: item.quantity
          }))
        }
      },
      include: {
        order_items: true
      }
    });
  }
}