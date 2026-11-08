const mongoose = require("mongoose");

const roomRestrictionSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: [
        "Minimum Stay",
        "Maximum Stay",
        "Closed to Arrival",
        "Closed to Departure",
        "Stop Sell",
        "Advance Booking",
      ],
      required: true,
    },

    roomTypes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RoomType",
      },
    ],

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    days: {
      type: [String],
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      default: [],
    },

    minStay: {
      type: Number,
      default: null,
      min: 1,
    },

    maxStay: {
      type: Number,
      default: null,
      min: 1,
    },

    advanceDays: {
      type: Number,
      default: null,
      min: 0,
    },

    reason: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

roomRestrictionSchema.index({
  status: 1,
  startDate: 1,
  endDate: 1,
});

module.exports = mongoose.model(
  "RoomRestriction",
  roomRestrictionSchema
);