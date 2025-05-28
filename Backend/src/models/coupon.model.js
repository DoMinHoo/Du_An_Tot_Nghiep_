const mongoose = require('mongoose');

// Định nghĩa schema cho Coupons
const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true, // Đảm bảo mã giảm giá là duy nhất
    },
    description: {
        type: String,
        required: true,
    },
    discountType: {
        type: String,
        required: true,
        enum: ['percent', 'fixed'], // Chỉ cho phép "percent" hoặc "fixed"
    },
    discountValue: {
        type: Number,
        required: true,
    },
    minOrderAmount: {
        type: Number,
        required: true,
    },
    maxUsage: {
        type: Number,
        required: true,
    },
    usedCount: {
        type: Number,
        default: 0, // Giá trị mặc định là 0 (chưa sử dụng)
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now, // Mặc định là ngày giờ hiện tại
    },
});

// Tạo và xuất mô hình
const Coupon = mongoose.model('Coupon', couponSchema);
module.exports = Coupon;
