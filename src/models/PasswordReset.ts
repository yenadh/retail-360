// src/models/PasswordReset.ts

import mongoose, { Schema, models } from "mongoose";

const PasswordResetSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    codeHash: {
      type: String,
      required: true,
    },

    attempts: {
      type: Number,
      default: 0,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

PasswordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PasswordReset =
  models.PasswordReset || mongoose.model("PasswordReset", PasswordResetSchema);

export default PasswordReset;
