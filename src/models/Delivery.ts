import mongoose, { Schema, models } from "mongoose";

const DeliverySchema = new Schema(
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

    deliveryStaffId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    trackingNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    deliveryStatus: {
      type: String,
      enum: [
        "PENDING",
        "READY_FOR_DISPATCH",
        "DISPATCHED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "FAILED",
        "RETURNED",
      ],
      default: "PENDING",
    },

    deliveryAddress: {
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

    estimatedDeliveryDate: {
      type: Date,
      default: null,
    },

    dispatchedAt: {
      type: Date,
      default: null,
    },

    outForDeliveryAt: {
      type: Date,
      default: null,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },

    failedAt: {
      type: Date,
      default: null,
    },

    returnedAt: {
      type: Date,
      default: null,
    },

    deliveryNotes: {
      type: String,
      default: "",
      trim: true,
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

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const Delivery = models.Delivery || mongoose.model("Delivery", DeliverySchema);

export default Delivery;
