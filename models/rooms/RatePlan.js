const mongoose = require("mongoose");

const ratePlanSchema = new mongoose.Schema(
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
        "Standard",
        "Non-refundable",
        "Seasonal",
        "Corporate",
        "Meal-inclusive",
        "Other",
      ],
      default: "Standard",
    },

    description: {
      type: String,
      default: "",
    },

    roomTypes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RoomType",
      },
    ],

    priceType: {
      type: String,
      enum: ["Fixed", "Percentage"],
      default: "Fixed",
    },

    baseRate: {
      type: Number,
      required: true,
      min: 0,
    },

    adjustment: {
      type: Number,
      default: 0,
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
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

    mealPlan: {
      type: String,
      default: "Room Only",
    },

    minStay: {
      type: Number,
      default: 1,
      min: 1,
    },

    maxStay: {
      type: Number,
      default: null,
      min: 1,
    },

    cancellation: {
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

ratePlanSchema.index({ status: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model("RatePlan", ratePlanSchema);