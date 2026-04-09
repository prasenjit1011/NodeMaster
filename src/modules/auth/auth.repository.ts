import { prisma } from '../../config/db';

export const findUserByEmail = (email: string) => {
  return prisma.customer.findUnique({
    where: { email },
  });
};

export const createUser = (data: {
  name?: string;
  email: string;
  password: string;
}) => {
  return prisma.customer.create({ data });
};