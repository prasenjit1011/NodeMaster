import Fastify, { FastifyRequest, FastifyReply } from "fastify";
import mongoose, { Schema, Types, Document } from "mongoose";

const app = Fastify({ logger: true });

// --------------------
// INTERFACES
// --------------------

interface ICustomer extends Document {
  name: string;
  email: string;
  city: string;
}

interface IProduct extends Document {
  name: string;
  price: number;
  stock: number;
}

interface IOrder extends Document {
  customerId: Types.ObjectId;
  status: string;
}

interface IOrderItem extends Document {
  orderId: Types.ObjectId;
  productId: Types.ObjectId;
  quantity: number;
  price: number;
}

// --------------------
// SCHEMAS
// --------------------

const Customer = mongoose.model<ICustomer>(
  "Customer",
  new Schema({
    name: String,
    email: String,
    city: String,
  })
);

const Product = mongoose.model<IProduct>(
  "Product",
  new Schema({
    name: String,
    price: Number,
    stock: Number,
  })
);

const Order = mongoose.model<IOrder>(
  "Order",
  new Schema({
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    status: String,
  })
);

const OrderItem = mongoose.model<IOrderItem>(
  "OrderItem",
  new Schema({
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    quantity: Number,
    price: Number,
  })
);

// --------------------
// DB CONNECT
// --------------------

mongoose
  .connect("mongodb://127.0.0.1:27017/ecommerce")
  .then(() => console.log("MongoDB Connected"))
  .catch((err: unknown) => {
    if (err instanceof Error) console.error(err.message);
  });

// --------------------
// ROUTES
// --------------------

// Customers
app.post("/customers", async (req: FastifyRequest, reply: FastifyReply) => {
  const data = await Customer.create(req.body);
  return reply.send(data);
});

app.get("/customers", async (_req: FastifyRequest, reply: FastifyReply) => {
  const data = await Customer.find();
  return reply.send(data);
});

// Products
app.post("/products", async (req: FastifyRequest, reply: FastifyReply) => {
  const data = await Product.create(req.body);
  return reply.send(data);
});

app.get("/products", async (_req: FastifyRequest, reply: FastifyReply) => {
  const data = await Product.find();
  return reply.send(data);
});

// Orders
app.post("/orders", async (req: FastifyRequest, reply: FastifyReply) => {
  const data = await Order.create(req.body);
  return reply.send(data);
});

app.get("/orders", async (_req: FastifyRequest, reply: FastifyReply) => {
  const data = await Order.find().populate("customerId");
  return reply.send(data);
});

// Order Items
app.post("/order-items", async (req: FastifyRequest, reply: FastifyReply) => {
  const data = await OrderItem.create(req.body);
  return reply.send(data);
});

app.get("/order-items", async (_req: FastifyRequest, reply: FastifyReply) => {
  const data = await OrderItem.find()
    .populate("productId")
    .populate("orderId");

  return reply.send(data);
});

// Clear DB
app.delete("/clear", async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    await Promise.all([
      Customer.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
      OrderItem.deleteMany({}),
    ]);

    return reply.send({ message: "All collections cleared" });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return reply.status(500).send({ error: err.message });
    }
  }
});

// Seed Data
app.post("/seed", async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    const customers = await Customer.insertMany([
      { name: "Alice", email: "alice@mail.com", city: "Delhi" },
      { name: "Bob", email: "bob@mail.com", city: "Mumbai" },
    ]);

    const products = await Product.insertMany([
      { name: "Laptop", price: 50000, stock: 10 },
      { name: "Phone", price: 20000, stock: 20 },
      { name: "Watch", price: 5000, stock: 15 },
    ]);

    const order = await Order.create({
      customerId: customers[0]._id,
      status: "completed",
    });

    const orderItems = await OrderItem.insertMany([
      {
        orderId: order._id,
        productId: products[0]._id,
        quantity: 1,
        price: products[0].price,
      },
      {
        orderId: order._id,
        productId: products[1]._id,
        quantity: 2,
        price: products[1].price,
      },
    ]);

    return reply.send({
      message: "Dummy data inserted",
      customers,
      products,
      order,
      orderItems,
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return reply.status(500).send({ error: err.message });
    }
    return reply.status(500).send({ error: "Unknown error" });
  }
});

// --------------------
// START SERVER
// --------------------

const start = async () => {
  try {
    await app.listen({ port: 3000 });
    console.log("Server running at http://localhost:3000");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();