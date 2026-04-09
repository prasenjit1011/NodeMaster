export type CreateOrderInput = {
  items: {
    item_id: number;
    quantity: number;
  }[];
};