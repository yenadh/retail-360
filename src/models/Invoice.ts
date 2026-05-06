// src/models/Invoice.ts

import mongoose, { Schema, models } from "mongoose";

const InvoiceSchema = new Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },

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

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
    },

    issuedAt: {
      type: Date,
      default: Date.now,
    },

    invoiceUrl: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

const Invoice = models.Invoice || mongoose.model("Invoice", InvoiceSchema);

export default Invoice;
