import mongoose, { Schema, Document } from 'mongoose';

// Interface (Type Safety)
export interface IProduct extends Document {
  name: string;
  price: number;
  category?: string;
  inStock?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema: Schema<IProduct> = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true
    },
    category: {
      type: String,
      default: "general"
    },
    inStock: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export const Product = mongoose.model<IProduct>('Product', productSchema);