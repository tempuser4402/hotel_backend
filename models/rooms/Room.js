const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    roomType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoomType",
      required: true,
    },

    floor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Floor",
      required: true,
    },

    wing: {
      type: String,
      trim: true,
      default: "",
    },

    capacity: {
      type: Number,
      min: 1,
      default: 2,
    },

    currentPrice: {
      type: Number,
      min: 0,
      default: 0,
    },

    status: {
      type: String,
      enum: [
        "Available",
        "Occupied",
        "Reserved",
        "Cleaning",
        "Maintenance",
      ],
      default: "Available",
    },

    housekeepingStatus: {
      type: String,
      enum: ["Clean", "Dirty", "In Progress", "Inspected"],
      default: "Clean",
    },

    maintenanceStatus: {
      type: String,
      enum: [
        "Normal",
        "Pending",
        "In Progress",
        "Completed",
        "Repair required",
        "Under Maintenance",
      ],
      default: "Normal",
    },

    facilities: {
      type: [String],
      default: [],
    },

    notes: {
      type: String,
      default: "",
    },

    // Position within the floor plan.
    position: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

roomSchema.index({ floor: 1, position: 1 });
roomSchema.index({ roomType: 1 });
roomSchema.index({ status: 1, isActive: 1 });

module.exports = mongoose.model("Room", roomSchema);