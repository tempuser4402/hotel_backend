const mongoose = require("mongoose");

const roomTypeSchema = new mongoose.Schema(
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
    description: {
      type: String,
      default: "",
    },

    maxAdults: {
      type: Number,
      required: true,
      min: 1,
    },
    maxChildren: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxOccupancy: {
      type: Number,
      min: 1,
      default: 2,
    },

    bedConfiguration: {
      type: String,
      default: "Queen",
    },
    bedType: {
      type: String,
      default: "Queen",
    },
    bedCount: {
      type: Number,
      default: 1,
      min: 1,
    },

    size: {
      type: Number,
      default: 0,
      min: 0,
    },
    sizeUnit: {
      type: String,
      enum: ["sq.ft", "sq.m"],
      default: "sq.ft",
    },

    defaultPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    basePrice: {
      type: Number,
      min: 0,
      default: 0,
    },

    // Amenity names used by the current frontend.
    amenities: {
      type: [String],
      default: [],
    },

    // Optional references to the central Amenity collection.
    amenityIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Amenity",
      },
    ],

    image: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

roomTypeSchema.pre("validate", function () {
  this.maxOccupancy =
    Number(this.maxAdults || 0) + Number(this.maxChildren || 0);

  if (this.basePrice == null || this.basePrice === 0) {
    this.basePrice = this.defaultPrice;
  }

  if (this.defaultPrice == null || this.defaultPrice === 0) {
    this.defaultPrice = this.basePrice;
  }
});

module.exports = mongoose.model("RoomType", roomTypeSchema);
