// src/models/cart.model.js
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    variationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariation', // Tham chiếu đến ProductVariation
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    }
}, { _id: false });

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        unique: true, // Mỗi user chỉ có 1 giỏ hàng
        required: true
    },
    items: [cartItemSchema]
}, {
    timestamps: true,
    versionKey: false
});

module.exports = mongoose.model('Cart', cartSchema);