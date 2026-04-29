import mongoose from "mongoose";

/* =========================
   USER COLLECTION
========================= */
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    age: { type: Number, default: 18 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/* =========================
   PRODUCT COLLECTION
   (ARRAY + OPERATORS ready)
========================= */
const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    tags: [{ type: String }], // for $push, $pull, $addToSet
  },
  { timestamps: true }
);

/* =========================
   ORDER COLLECTION
   (RELATION + NESTED + LOOKUP READY)
========================= */
const OrderSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [
      {
        product_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        qty: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],

    total_price: { type: Number, required: true },

    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

/* =========================
   MODELS EXPORT
========================= */
export const User = mongoose.model("User", UserSchema);
export const Product = mongoose.model("Product", ProductSchema);
export const Order = mongoose.model("Order", OrderSchema);

/* =========================
   EXAMPLE USAGE (MongoDB KEYWORDS)
========================= */
async function demoQueries() {
  /* CREATE */
  await User.create({
    name: "Aluni",
    email: "aluni@test.com",
  });

  /* FIND ($gt, $in) */
  await Product.find({
    price: { $gt: 100 },
    tags: { $in: ["tech", "mobile"] },
  });

  /* UPDATE ($set, $inc) */
  await Product.updateOne(
    { _id: "PRODUCT_ID" },
    {
      $set: { name: "Updated Product" },
      $inc: { stock: -1 },
    }
  );

  /* ARRAY OPERATIONS */
  await Product.updateOne(
    { _id: "PRODUCT_ID" },
    {
      $push: { tags: "new-tag" },
    }
  );

  /* AGGREGATION ($match + $group) */
  await Order.aggregate([
    { $match: { status: "completed" } },
    {
      $group: {
        _id: "$user_id",
        totalSpent: { $sum: "$total_price" },
      },
    },
  ]);

  /* JOIN ($lookup) */
  await Order.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "userInfo",
      },
    },
  ]);
}