import { query } from "../config/db";

// Strong Type
export interface Item {
  id?: number;
  name: string;
  price: number;
}

// DB Result Types (MySQL/MariaDB)
interface InsertResult {
  insertId: number;
}

interface UpdateResult {
  affectedRows: number;
}

export class ItemRepository {

  async findAll(): Promise<Item[]> {
    const rows = await query<Item[]>("SELECT * FROM items order by id desc");
    return rows;
  }

  async findById(id: number): Promise<Item | null> {
    const rows = await query<Item[]>(
      "SELECT * FROM items WHERE id = ?",
      [id]
    );

    return rows[0] || null;
  }

  async create(item: Item): Promise<Item> {
    const { name, price } = item;

    const result = await query<InsertResult>(
      "INSERT INTO items (name, price) VALUES (?, ?)",
      [name, price]
    );

    return {
      id: result.insertId,
      name,
      price
    };
  }

  // ✅ Return updated item instead of boolean (recommended)
  async update(id: number, item: Partial<Item>): Promise<Item | null> {
    const { name, price } = item;

    const result = await query<UpdateResult>(
      "UPDATE items SET name = ?, price = ? WHERE id = ?",
      [name, price, id]
    );

    if (result.affectedRows === 0) {
      return null;
    }

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await query<UpdateResult>(
      "DELETE FROM items WHERE id = ?",
      [id]
    );

    return result.affectedRows > 0;
  }
}