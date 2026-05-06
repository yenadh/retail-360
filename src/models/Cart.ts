// src/models/Cart.ts

import mongoose, { Schema, models } from "mongoose";

const CartItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const CartSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    items: [CartItemSchema],
  },
  {
    timestamps: true,
  },
);

const Cart = models.Cart || mongoose.model("Cart", CartSchema);

export default Cart;
