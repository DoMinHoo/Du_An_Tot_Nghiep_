// src/models/order.model.js
const mongoose = require('mongoose');

// Schema cho từng mục trong items
const itemSchema = new mongoose.Schema({
    variationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariation',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    salePrice: {
        type: Number,
        required: true // Lưu giá tại thời điểm tạo đơn hàng
    }
}, { _id: false });

// Schema cho lịch sử trạng thái
const statusHistorySchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['pending', 'shipping', 'completed', 'canceled'],
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
}, { _id: false });

// Schema cho địa chỉ giao hàng
const shippingAddressSchema = new mongoose.Schema({
    street: { type: String, required: true },
    city: { type: String, required: true },
    zipCode: { type: String },
    country: { type: String, default: 'Vietnam' }
}, { _id: false });

// Schema chính cho đơn hàng
const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderCode: {
        type: String,
        required: true,
        unique: true
    },
    customerName: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'shipping', 'completed', 'canceled'],
        default: 'pending',
        required: true
    },
    shippingAddress: {
        type: shippingAddressSchema,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['cod', 'bank_transfer', 'online_payment'],
        required: true
    },
    items: [itemSchema],
    statusHistory: [statusHistorySchema]
}, {
    timestamps: true,
    versionKey: false
});

orderSchema.index({ orderCode: 1 });
orderSchema.index({ userId: 1 });
orderSchema.index({ 'items.variationId': 1 });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;