import { prisma } from '../config/db';
import { Item, CreateItemDTO, UpdateItemDTO } from "../models/item.model";

export class ItemRepository {

  async findAll(){
    const items = await prisma.item.findMany({
      orderBy: { id: "desc" },
    });

    return items.map(item => ({
      id: item.id,
      name: item.name ?? "",
      price: item.price ?? 0,
    }));
  }

  async findById(id: number): Promise<Item | null> {
    const item = await prisma.item.findUnique({
      where: { id },
    });

    if (!item) return null;

    return {
      id: item.id,
      name: item.name ?? "",
      price: item.price ?? 0,
    };
  }

  async create(data: CreateItemDTO): Promise<Item> {
    const createdItem = await prisma.item.create({
      data,
    });

    return {
      id: createdItem.id,
      name: createdItem.name ?? "",
      price: createdItem.price ?? 0,
    };
  }

  async update(id: number, data: UpdateItemDTO): Promise<Item | null> {
    try {
      const updatedItem = await prisma.item.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.price !== undefined && { price: data.price }),
        },
      });

      return {
        id: updatedItem.id,
        name: updatedItem.name ?? "",
        price: updatedItem.price ?? 0,
      };
    } catch (error) {
      // If record not found
      return null;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      await prisma.item.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}