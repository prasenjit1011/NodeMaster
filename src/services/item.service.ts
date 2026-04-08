import { ItemRepository } from "../repositories/item.repository";

// Types
export interface Item {
  id?: number;
  name: string;
  price: number;
}

export class ItemService {
  private repo: ItemRepository;

  constructor() {
    this.repo = new ItemRepository();
  }

  async getAllItems(): Promise<Item[]> {
    return await this.repo.findAll();
  }

  async getItem(id: number): Promise<Item | null> {
    return await this.repo.findById(id);
  }

  async createItem(item: Item): Promise<Item> {
    return await this.repo.create(item);
  }

  async updateItem(id: number, item: Partial<Item>): Promise<boolean> {
    // update query
    return true; // or false
  }

  async deleteItem(id: number): Promise<boolean> {
    return await this.repo.delete(id);
  }
}