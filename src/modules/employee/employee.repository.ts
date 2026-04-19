import { prisma } from '../../config/db';
import { Employee } from './employee.interface';

export class EmployeeRepository {

  async create(data: Employee) {
    return prisma.employee.create({ data });
  }

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.employee.findMany({
        skip,
        take: limit,
        orderBy: { id: 'desc' }
      }),
      prisma.employee.count()
    ]);

    return { data, total };
  }

  async findById(id: number) {
    return prisma.employee.findUnique({ where: { id } });
  }

  async update(id: number, data: Employee) {
    return prisma.employee.update({
      where: { id },
      data
    });
  }

  async delete(id: number) {
    return prisma.employee.delete({ where: { id } });
  }
}