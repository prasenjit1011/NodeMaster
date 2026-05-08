import express, { Request, Response } from "express";
import mongoose, { Schema, Types, Document } from "mongoose";
import cors from "cors"; // ✅ REQUIRED
import fs from "fs/promises";
import path from "path";

// mongoose.set("versionKey", false);

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

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
const schemaOptions = {
  versionKey: false,
  timestamps: true,
};

const Customer = mongoose.model<ICustomer>("Customer",
  new Schema({
    name: String,
    email: String,
    city: String
  })
);

const Product = mongoose.model<IProduct>("Product",
  new Schema({
    name: String,
    price: Number,
    stock: Number
  },
  {
    versionKey: false,
    timestamps: true,
  })
);

const Order = mongoose.model<IOrder>("Order",
  new Schema({
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    status: String
  })
);

const OrderItem = mongoose.model<IOrderItem>("OrderItem",
  new Schema({
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    quantity: Number,
    price: Number
  })
);

// --------------------
// DB CONNECT
// --------------------

mongoose.connect("mongodb://127.0.0.1:27017/ecommerce")
  .then(() => console.log("MongoDB Connected"))
  .catch((err: unknown) => {
    if (err instanceof Error) console.error(err.message);
  });

// --------------------
// ROUTES
// --------------------

type User = {
  id: number;
  userId: number;
  title: string;
  completed: boolean;
};

app.get("/api/users", async (req, res) => {
  try {
    const filePath = path.join(__dirname, "public", "data.json");

    const data = await fs.readFile(filePath, "utf-8");

    const users: User[] = JSON.parse(data);

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "File read error" });
  }
});



// Customers
app.post("/customers", async (req: Request, res: Response) => {
  const data = await Customer.create(req.body);
  res.json(data);
});

app.get("/customers", async (_: Request, res: Response) => {
  const data = await Customer.find();
  res.json(data);
});

// Products
app.post("/products", async (req: Request, res: Response) => {
  // const data = req.body;
  const data = await Product.create(req.body);
  res.json(data);
});

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
app.get("/products", async (_: Request, res: Response) => {
  console.log('==== 1111 ====', new Date().toISOString());
  await delay(5000);
  console.log('==== 2222 ====', new Date().toISOString());

  const data = await Product.find();
  res.json(data);
});

app.get("/productlist", async (req: Request, res: Response) => {
  try {
    console.log("==== 1111 ====");

    await delay(500); // simulate delay

    console.log("==== 2222 ====");

    // query params
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);

    const skip = (page - 1) * limit;

    // fetch data + total count
    const [products, total] = await Promise.all([
      Product.find().skip(skip).limit(limit),
      Product.countDocuments()
    ]);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: products
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});


// Orders
app.post("/orders", async (req: Request, res: Response) => {
  const data = await Order.create(req.body);
  res.json(data);
});

app.get("/orders", async (_: Request, res: Response) => {
  const data = await Order.find().populate("customerId");
  res.json(data);
});

// Order Items
app.post("/order-items", async (req: Request, res: Response) => {
  const data = await OrderItem.create(req.body);
  res.json(data);
});

app.get("/order-items", async (_: Request, res: Response) => {
  const data = await OrderItem.find()
    .populate("productId")
    .populate("orderId");
  res.json(data);
});


app.delete("/clear", async (_req: Request, res: Response) => {
  try {
    await Promise.all([
      Customer.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
      OrderItem.deleteMany({})
    ]);

    res.json({ message: "All collections cleared" });
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    }
  }
});

app.post("/seed", async (_req: Request, res: Response) => {
  try {
    // Clear old data (optional)
    // await Promise.all([
    //   Customer.deleteMany({}),
    //   Product.deleteMany({}),
    //   Order.deleteMany({}),
    //   OrderItem.deleteMany({})
    // ]);

    // --------------------
    // CREATE CUSTOMERS
    // --------------------
    const customers = await Customer.insertMany([
      { name: "Alice", email: "alice@mail.com", city: "Delhi" },
      { name: "Bob", email: "bob@mail.com", city: "Mumbai" }
    ]);

    // --------------------
    // CREATE PRODUCTS
    // --------------------
    const products = await Product.insertMany([
      { name: "Laptop", price: 50000, stock: 10 },
      { name: "Phone", price: 20000, stock: 20 },
      { name: "Watch", price: 5000, stock: 15 }
    ]);

    // --------------------
    // CREATE ORDER
    // --------------------
    const order = await Order.create({
      customerId: customers[0]._id,
      status: "completed"
    });

    // --------------------
    // CREATE ORDER ITEMS
    // --------------------
    const orderItems = await OrderItem.insertMany([
      {
        orderId: order._id,
        productId: products[0]._id,
        quantity: 1,
        price: products[0].price
      },
      {
        orderId: order._id,
        productId: products[1]._id,
        quantity: 2,
        price: products[1].price
      }
    ]);

    res.json({
      message: "Dummy data inserted",
      customers,
      products,
      order,
      orderItems
    });

  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Unknown error" });
    }
  }
});
// --------------------
// START SERVER
// --------------------

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});