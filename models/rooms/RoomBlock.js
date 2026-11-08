const mongoose = require("mongoose");

const roomBlockSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    blockType: {
      type: String,
      enum: [
        "Maintenance",
        "Renovation",
        "Owner Use",
        "Out of Order",
        "Other",
      ],
      default: "Maintenance",
    },

    status: {
      type: String,
      enum: ["Blocked", "Released", "Cancelled"],
      default: "Blocked",
    },

    notes: {
      type: String,
      default: "",
    },

    releasedAt: {
      type: Date,
      default: null,
    },

    releasedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

roomBlockSchema.index({ room: 1, startDate: 1, endDate: 1, status: 1 });

module.exports = mongoose.model("RoomBlock", roomBlockSchema);