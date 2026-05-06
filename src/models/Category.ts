// src/models/Category.ts

import mongoose, { Schema, models } from "mongoose";

const CategorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
    },

    slug: {
      type: String,
      required: [true, "Category slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    image: {
      url: {
        type: String,
        default: "",
      },
      publicId: {
        type: String,
        default: "",
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const Category = models.Category || mongoose.model("Category", CategorySchema);

export default Category;
