// src/models/Product.ts

import mongoose, { Schema, models } from "mongoose";

const ProductSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },

    slug: {
      type: String,
      required: [true, "Product slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },

    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      default: null,
    },

    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
    },

    discountPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    stockQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    reservedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    reorderLevel: {
      type: Number,
      default: 10,
      min: 0,
    },

    batchNumber: {
      type: String,
      default: "",
      trim: true,
    },

    images: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          default: "",
        },
      },
    ],

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const Product = models.Product || mongoose.model("Product", ProductSchema);

export default Product;
