import mongoose, { Schema, models } from "mongoose";

const OrderItemSchema = new Schema(
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

    sku: {
      type: String,
      default: "",
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

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const ShippingAddressSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    postalCode: {
      type: String,
      default: "",
      trim: true,
    },

    country: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: false,
  },
);

const OrderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },

    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [OrderItemSchema],

    shippingAddress: {
      type: ShippingAddressSchema,
      required: true,
    },

    subtotal: {
      type: Number,
      required: true,
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

    orderStatus: {
      type: String,
      enum: [
        "PENDING",
        "CONFIRMED",
        "PROCESSING",
        "PACKED",
        "DISPATCHED",
        "DELIVERED",
        "CANCELLED",
        "RETURNED",
      ],
      default: "PENDING",
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
    },

    paymentMethod: {
      type: String,
      enum: ["CARD", "BANK_TRANSFER", "CASH_ON_DELIVERY", "MOCK_PAYMENT"],
      default: "MOCK_PAYMENT",
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    confirmedAt: {
      type: Date,
      default: null,
    },

    processedAt: {
      type: Date,
      default: null,
    },

    packedAt: {
      type: Date,
      default: null,
    },

    dispatchedAt: {
      type: Date,
      default: null,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
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

const Order = models.Order || mongoose.model("Order", OrderSchema);

export default Order;
