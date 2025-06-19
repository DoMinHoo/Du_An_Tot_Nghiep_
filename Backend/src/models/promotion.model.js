// src/models/promotion.model.js
const mongoose = require("mongoose");

const promotionSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Mã khuyến mãi không được bỏ trống"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: [true, "Loại giảm giá là bắt buộc"],
    },
    discountValue: {
      type: Number,
      required: [true, "Giá trị giảm giá là bắt buộc"],
      min: [0, "Giá trị giảm không hợp lệ"],
    },
    expiryDate: { type: Date },
    isActive: { type: Boolean, default: true },
    minOrderValue: {
      type: Number,
      default: 0,
      min: [0, "Giá trị đơn hàng tối thiểu không hợp lệ"],
    },
    usageLimit: {
      type: Number,
      default: 0, // 0 nghĩa là không giới hạn
      min: [0, "Số lượt sử dụng không hợp lệ"],
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Promotion", promotionSchema);
