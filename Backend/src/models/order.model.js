const mongoose = require('mongoose');

// Schema cho từng mục trong items
const itemSchema = new mongoose.Schema({
    variationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariation', // Lượng biến thể sản phẩm
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Sản phẩm cha
        required: true
    },
    name: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    salePrice: {
        type: Number,
        required: true
    }
}, { _id: false }); // Không cần _id cho mỗi item

// Schema cho từng mục trong statusHistory
const statusHistorySchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['pending', 'shipping', 'completed', 'canceled'], // Các trạng thái hợp lệ
        required: true
    },
    changedAt: {
        type: Date,
        default: Date.now,
        required: true
    },
    note: {
        type: String,
        default: ''
    }
}, { _id: false }); // Không cần _id cho mỗi mục trong lịch sử trạng thái

// Schema chính cho đơn hàng
const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Liên kết đến bảng User
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'shipping', 'completed', 'canceled'], // Các trạng thái đơn hàng
        default: 'pending',
        required: true
    },
    shippingAddress: {
        type: String,
        required: true
    },
    items: [itemSchema], // Danh sách sản phẩm đã đặt hàng
    statusHistory: [statusHistorySchema], // Lịch sử trạng thái của đơn hàng
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Tạo model và xuất ra ngoài
const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
