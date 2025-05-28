const mongoose = require('mongoose');

// Định nghĩa Schema cho bảng "cart"
const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Liên kết với bảng User
        required: true,
    },
    variationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariation', // Liên kết với bảng ProductVariation
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1, // Số lượng ít nhất là 1
    },
    createdAt: {
        type: Date,
        default: Date.now, // Thời gian tạo dòng giỏ hàng
    },
});

// Tạo model từ schema và xuất ra
module.exports = mongoose.model('Cart', cartSchema);
