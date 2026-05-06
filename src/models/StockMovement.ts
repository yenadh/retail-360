import mongoose, { Schema, models } from "mongoose";

const StockMovementSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    movementType: {
      type: String,
      enum: [
        "STOCK_IN",
        "STOCK_OUT",
        "SALE",
        "RETURN",
        "ADJUSTMENT",
        "DAMAGED",
        "CANCELLED_ORDER_RESTOCK",
      ],
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    previousStock: {
      type: Number,
      required: true,
      min: 0,
    },

    newStock: {
      type: Number,
      required: true,
      min: 0,
    },

    reason: {
      type: String,
      default: "",
      trim: true,
    },

    referenceType: {
      type: String,
      enum: ["ORDER", "SUPPLIER", "MANUAL", "RETURN", "DAMAGE"],
      default: "MANUAL",
    },

    referenceId: {
      type: Schema.Types.ObjectId,
      default: null,
    },

    batchNumber: {
      type: String,
      default: "",
      trim: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const StockMovement =
  models.StockMovement || mongoose.model("StockMovement", StockMovementSchema);

export default StockMovement;
