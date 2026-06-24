import express, { Request, Response } from "express";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

type User = {
  id: number;
  userId: number;
  title: string;
  completed: boolean;
};

const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// --------------------
// FILE API
// --------------------


app.get("/health", async (_req: Request, res: Response) => {
  try {
    await prisma.$runCommandRaw({ ping: 1 });

    res.json({
      status: "UP",
      database: "CONNECTED"
    });

  } catch (error) {
    res.status(500).json({
      status: "DOWN",
      database: "DISCONNECTED",
      error
    });
  }
});

app.get("/api/users", async (_req: Request, res: Response) => {
  try {
    const filePath = path.join(__dirname, "public", "data.json");

    const data = await fs.readFile(filePath, "utf-8");

    const users: User[] = JSON.parse(data);

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "File read error" });
  }
});

// --------------------
// CUSTOMERS
// --------------------

app.post("/customers", async (req: Request, res: Response) => {
  try {
    const customer = await prisma.customer.create({
      data: {
        name: req.body.name,
        email: req.body.email,
        city: req.body.city,
      },
    });

    res.json(customer);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

app.get("/customers", async (_req: Request, res: Response) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(customers);
  } catch (error) {
    res.status(500).json(error);
  }
});

// --------------------
// PRODUCTS
// --------------------

app.post("/products", async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.create({
      data: {
        name: req.body.name,
        price: Number(req.body.price),
        stock: Number(req.body.stock),
      },
    });

    res.json(product);
  } catch (error) {
    res.status(500).json(error);
  }
});

app.get("/products", async (_req: Request, res: Response) => {
  try {
    console.log("==== START ====");
    await delay(5000);

    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log("==== END ====");

    res.json(products);
  } catch (error) {
    res.status(500).json(error);
  }
});

// --------------------
// PRODUCT LIST WITH PAGINATION
// --------------------

app.get("/productlist", async (req: Request, res: Response) => {
  try {
    await delay(500);

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 100);

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        skip,
        take: limit,
      }),
      prisma.product.count(),
    ]);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
      error,
    });
  }
});

// --------------------
// ORDERS
// --------------------

app.post("/orders", async (req: Request, res: Response) => {
  try {
    const order = await prisma.order.create({
      data: {
        customerId: req.body.customerId,
        status: req.body.status,
      },
    });

    res.json(order);
  } catch (error) {
    res.status(500).json(error);
  }
});

app.get("/orders", async (_req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        customer: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json(error);
  }
});

// --------------------
// ORDER ITEMS
// --------------------

app.post("/order-items", async (req: Request, res: Response) => {
  try {
    const orderItem = await prisma.orderItem.create({
      data: {
        orderId: req.body.orderId,
        productId: req.body.productId,
        quantity: Number(req.body.quantity),
        price: Number(req.body.price),
      },
    });

    res.json(orderItem);
  } catch (error) {
    res.status(500).json(error);
  }
});

app.get("/order-items", async (_req: Request, res: Response) => {
  try {
    const orderItems = await prisma.orderItem.findMany({
      include: {
        order: true,
        product: true,
      },
    });

    res.json(orderItems);
  } catch (error) {
    res.status(500).json(error);
  }
});

// --------------------
// CLEAR DATABASE
// --------------------

app.delete("/clear", async (_req: Request, res: Response) => {
  try {
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.customer.deleteMany();

    res.json({
      message: "All collections cleared",
    });
  } catch (error) {
    res.status(500).json(error);
  }
});

// --------------------
// SEED DATA
// --------------------

app.post("/seed", async (_req: Request, res: Response) => {
  try {
    const alice = await prisma.customer.create({
      data: {
        name: "Alice",
        email: "alice@mail.com",
        city: "Delhi",
      },
    });

    const bob = await prisma.customer.create({
      data: {
        name: "Bob",
        email: "bob@mail.com",
        city: "Mumbai",
      },
    });

    const laptop = await prisma.product.create({
      data: {
        name: "Laptop",
        price: 50000,
        stock: 10,
      },
    });

    const phone = await prisma.product.create({
      data: {
        name: "Phone",
        price: 20000,
        stock: 20,
      },
    });

    const watch = await prisma.product.create({
      data: {
        name: "Watch",
        price: 5000,
        stock: 15,
      },
    });

    const order = await prisma.order.create({
      data: {
        customerId: alice.id,
        status: "completed",
      },
    });

    const item1 = await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: laptop.id,
        quantity: 1,
        price: laptop.price,
      },
    });

    const item2 = await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: phone.id,
        quantity: 2,
        price: phone.price,
      },
    });

    res.json({
      message: "Dummy data inserted",
      customers: [alice, bob],
      products: [laptop, phone, watch],
      order,
      orderItems: [item1, item2],
    });
  } catch (error) {
    res.status(500).json(error);
  }
});

// --------------------
// GRACEFUL SHUTDOWN
// --------------------

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// --------------------
// START SERVER
// --------------------

const PORT = 3000;

async function startServer() {
  try {
    await prisma.$connect();
    console.log("✅ Prisma connected to MongoDB");

    // Test query
    await prisma.customer.count();
    console.log("✅ Database query successful");

    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error(error);

    process.exit(1);
  }
}

startServer();