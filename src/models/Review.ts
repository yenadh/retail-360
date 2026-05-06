// src/models/Review.ts

import mongoose, { Schema, models } from "mongoose";

const ReviewSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      default: "",
    },

    isApproved: {
      type: Boolean,
      default: false,
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

const Review = models.Review || mongoose.model("Review", ReviewSchema);

export default Review;
