const mongoose = require('mongoose');

// Định nghĩa Schema cho bảng "wishlist"
const wishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Tham chiếu tới bảng "users"
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Tham chiếu tới bảng "products"
        required: true
    },
    addedAt: {
        type: Date,
        default: Date.now // Thời gian thêm vào danh sách yêu thích
    }
});

// Tạo model "Wishlist"
const Wishlist = mongoose.model('Wishlist', wishlistSchema);

module.exports = Wishlist;
