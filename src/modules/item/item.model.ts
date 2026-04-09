export interface Item {
  id?: number;
  name: string;
  price: number;
}

// For create (no id required)
export type CreateItemDTO = Omit<Item, "id">;

// For update (partial fields allowed)
export type UpdateItemDTO = Partial<CreateItemDTO>;