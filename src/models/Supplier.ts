import mongoose, { Schema, models } from "mongoose";

const SupplierSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Supplier name is required"],
      trim: true,
    },

    contactPerson: {
      type: String,
      default: "",
      trim: true,
    },

    email: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    address: {
      type: String,
      default: "",
      trim: true,
    },

    city: {
      type: String,
      default: "",
      trim: true,
    },

    country: {
      type: String,
      default: "",
      trim: true,
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

const Supplier = models.Supplier || mongoose.model("Supplier", SupplierSchema);

export default Supplier;
