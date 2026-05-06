// src/models/Payment.ts

import mongoose, { Schema, models } from "mongoose";

const PaymentSchema = new Schema(
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

    paymentMethod: {
      type: String,
      enum: ["CARD", "BANK_TRANSFER", "CASH_ON_DELIVERY", "MOCK_PAYMENT"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"],
      default: "PENDING",
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    transactionReference: {
      type: String,
      default: "",
    },

    paidAt: {
      type: Date,
      default: null,
    },

    failureReason: {
      type: String,
      default: "",
    },

    refundAmount: {
      type: Number,
      default: 0,
      min: 0,
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

const Payment = models.Payment || mongoose.model("Payment", PaymentSchema);

export default Payment;
