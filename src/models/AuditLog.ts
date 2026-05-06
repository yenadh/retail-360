// src/models/AuditLog.ts

import mongoose, { Schema, models } from "mongoose";

const AuditLogSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    action: {
      type: String,
      required: true,
      trim: true,
    },

    module: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    entityId: {
      type: Schema.Types.ObjectId,
      default: null,
    },

    entityType: {
      type: String,
      default: "",
    },

    oldValue: {
      type: Schema.Types.Mixed,
      default: null,
    },

    newValue: {
      type: Schema.Types.Mixed,
      default: null,
    },

    ipAddress: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

const AuditLog = models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);

export default AuditLog;
