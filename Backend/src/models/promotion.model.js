// src/models/promotion.model.js
const mongoose = require("mongoose");

const promotionSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    discountValue: { type: Number, required: true },
    expiryDate: { type: Date },
    isActive: { type: Boolean, default: true },
    minOrderValue: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Promotion", promotionSchema);
