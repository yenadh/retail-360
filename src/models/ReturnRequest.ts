// src/models/ReturnRequest.ts

import mongoose, { Schema, models } from "mongoose";

const ReturnItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    productName: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    reason: {
      type: String,
      required: true,
    },
  },
  {
    _id: false,
  },
);

const ReturnRequestSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [ReturnItemSchema],

    returnStatus: {
      type: String,
      enum: ["REQUESTED", "APPROVED", "REJECTED", "RECEIVED", "REFUNDED"],
      default: "REQUESTED",
    },

    customerNote: {
      type: String,
      default: "",
    },

    adminNote: {
      type: String,
      default: "",
    },

    refundAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    refundedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const ReturnRequest =
  models.ReturnRequest || mongoose.model("ReturnRequest", ReturnRequestSchema);

export default ReturnRequest;
