
const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    type: {
      type: String,
      enum: ["Lost", "Found"],
      required: true
    },

    category: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    location: {
      type: String,
      required: true,
      trim: true
    },

    date: {
      type: Date,
      required: true
    },

    imageUrl: {
      type: String,
      default: ""
    },

    status: {
      type: String,
      enum: ["Active", "Matched", "Claimed", "Recovered", "Closed"],
      default: "Active"
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Item", itemSchema);
