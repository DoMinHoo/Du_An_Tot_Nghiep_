const mongoose = require('mongoose');

// Schema cho từng mục trong items
const itemSchema = new mongoose.Schema({
    variationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariation',
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
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
}, { _id: false });

// Schema cho từng mục trong statusHistory
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
        unique: true // mã đơn hàng phải là duy nhất
    },
    customerName: {
        type: String,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'shipping', 'completed', 'canceled'],
        default: 'pending',
        required: true
    },
    shippingAddress: {
        type: String,
        required: true
    },
    items: [itemSchema],
    statusHistory: [statusHistorySchema]
}, {
    timestamps: true,
    versionKey: false
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
