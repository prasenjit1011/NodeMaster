import { Request, Response, NextFunction } from "express";
import { Order } from "./order.model";


export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    next(err);
  }
}

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id, items } = req.body;

    // calculate total price
    const total_price = items.reduce(
      (sum: number, item: any) => sum + item.qty * item.price,
      0
    );

    const order = new Order({
      user_id,
      items,
      total_price,
    });

    const saved = await order.save();

    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
};