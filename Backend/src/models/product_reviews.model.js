const mongoose = require('mongoose');

// Định nghĩa Schema cho bảng "product_reviews"
const productReviewSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Tham chiếu đến Product
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Tham chiếu đến User
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    content: {
        type: String,
        required: true
    },
    images: {
        type: [String],
        default: []
    },

}, {
    timestamps: true, // Tự động tạo createdAt & updatedAt
    versionKey: false // Tắt __v        
});

// Tạo mô hình từ schema
module.exports = mongoose.model('ProductReview', productReviewSchema);
