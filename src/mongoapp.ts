import mongoose, { Schema, Document, Types } from "mongoose";

// --------------------
// INTERFACES
// --------------------

// Customer
interface ICustomer extends Document {
  name: string;
  email: string;
  city: string;
}

// Product
interface IProduct extends Document {
  name: string;
  price: number;
  stock: number;
}

// Order
interface IOrder extends Document {
  customerId: Types.ObjectId;
  orderDate: Date;
  status: string;
}

// Order Item
interface IOrderItem extends Document {
  orderId: Types.ObjectId;
  productId: Types.ObjectId;
  quantity: number;
  price: number;
}

// --------------------
// SCHEMAS
// --------------------

const customerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    city: { type: String, required: true }
  },
  { timestamps: true }
);

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true }
  },
  { timestamps: true }
);

const orderSchema = new Schema<IOrder>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true
    },
    orderDate: {
      type: Date,
      default: Date.now
    },
    status: { type: String, required: true }
  },
  { timestamps: true }
);

const orderItemSchema = new Schema<IOrderItem>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  },
  { timestamps: true }
);

// --------------------
// MODELS
// --------------------

const Customer = mongoose.model<ICustomer>("Customer", customerSchema);
const Product = mongoose.model<IProduct>("Product", productSchema);
const Order = mongoose.model<IOrder>("Order", orderSchema);
const OrderItem = mongoose.model<IOrderItem>("OrderItem", orderItemSchema);

// --------------------
// DB CONNECTION
// --------------------

async function connectDB(): Promise<void> {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/ecommerce");
    console.log("MongoDB Connected");
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("DB Error:", err.message);
    } else {
      console.error("Unknown DB Error:", err);
    }
    process.exit(1);
  }
}

// --------------------
// SEED DATA
// --------------------

async function seedData(): Promise<void> {
  try {
    await Customer.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await OrderItem.deleteMany({});

    // Customers
    const customers = await Customer.insertMany([
      { name: "Alice", email: "alice@mail.com", city: "Delhi" },
      { name: "Bob", email: "bob@mail.com", city: "Mumbai" }
    ]);

    // Products
    const products = await Product.insertMany([
      { name: "Laptop", price: 50000, stock: 10 },
      { name: "Phone", price: 20000, stock: 20 },
      { name: "Watch", price: 5000, stock: 15 }
    ]);

    // Order
    const order = await Order.create({
      customerId: customers[0]._id,
      status: "completed"
    });

    // Order Items
    await OrderItem.insertMany([
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

    console.log("Data Inserted");

    // --------------------
    // FETCH DATA
    // --------------------

    const orders = await Order.find()
      .populate("customerId")
      .lean();

    console.log("\nOrders:");
    console.log(JSON.stringify(orders, null, 2));

    const items = await OrderItem.find()
      .populate("productId")
      .populate("orderId")
      .lean();

    console.log("\nOrder Items:");
    console.log(JSON.stringify(items, null, 2));

  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Seed Error:", err.message);
    } else {
      console.error("Unknown Seed Error:", err);
    }
  }
}

// --------------------
// RUN APP
// --------------------

async function run(): Promise<void> {
  await connectDB();
  await seedData();
  process.exit(0);
}

run();

export { Customer, Product, Order, OrderItem };