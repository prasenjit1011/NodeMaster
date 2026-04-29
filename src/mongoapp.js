const mongoose = require("mongoose");

// --------------------
// DB CONNECTION
// --------------------
mongoose.connect("mongodb://127.0.0.1:27017/ecommerce")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// --------------------
// SCHEMAS
// --------------------

// Customer Schema
const customerSchema = new mongoose.Schema({
  name: String,
  email: String,
  city: String
}, { timestamps: true });

// Product Schema
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  stock: Number
}, { timestamps: true });

// Order Schema
const orderSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer"
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  status: String
}, { timestamps: true });

// Order Item Schema
const orderItemSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order"
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  },
  quantity: Number,
  price: Number
}, { timestamps: true });

// --------------------
// MODELS
// --------------------
const Customer = mongoose.model("Customer", customerSchema);
const Product = mongoose.model("Product", productSchema);
const Order = mongoose.model("Order", orderSchema);
const OrderItem = mongoose.model("OrderItem", orderItemSchema);

// --------------------
// INSERT SAMPLE DATA
// --------------------
async function seedData() {
  try {
    // Clear old data
    await Customer.deleteMany();
    await Product.deleteMany();
    await Order.deleteMany();
    await OrderItem.deleteMany();

    // Insert Customers
    const customers = await Customer.insertMany([
      { name: "Alice", email: "alice@mail.com", city: "Delhi" },
      { name: "Bob", email: "bob@mail.com", city: "Mumbai" }
    ]);

    // Insert Products
    const products = await Product.insertMany([
      { name: "Laptop", price: 50000, stock: 10 },
      { name: "Phone", price: 20000, stock: 20 },
      { name: "Watch", price: 5000, stock: 15 }
    ]);

    // Create Order
    const order1 = await Order.create({
      customerId: customers[0]._id,
      status: "completed"
    });

    // Insert Order Items
    await OrderItem.insertMany([
      {
        orderId: order1._id,
        productId: products[0]._id,
        quantity: 1,
        price: products[0].price
      },
      {
        orderId: order1._id,
        productId: products[1]._id,
        quantity: 2,
        price: products[1].price
      }
    ]);

    console.log("Data Inserted Successfully");

    // --------------------
    // FETCH WITH POPULATE
    // --------------------
    const result = await Order.find()
      .populate("customerId")
      .lean();

    console.log("\nOrders with Customer:");
    console.log(result);

    const orderItems = await OrderItem.find()
      .populate("productId")
      .populate("orderId")
      .lean();

    console.log("\nOrder Items with Product:");
    console.log(orderItems);

    process.exit();

  } catch (err) {
    console.error(err);
  }
}

seedData();