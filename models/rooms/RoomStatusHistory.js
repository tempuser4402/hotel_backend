const mongoose = require("mongoose");

const roomStatusHistorySchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },

    field: {
      type: String,
      enum: ["status", "housekeepingStatus", "maintenanceStatus"],
      required: true,
    },

    previousValue: {
      type: String,
      default: "",
    },

    newValue: {
      type: String,
      required: true,
    },

    reason: {
      type: String,
      default: "",
    },

    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

roomStatusHistorySchema.index({ room: 1, createdAt: -1 });

module.exports = mongoose.model(
  "RoomStatusHistory",
  roomStatusHistorySchema
);