const mongoose = require('mongoose');

// Định nghĩa schema cho bảng product_variations
const productVariationSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',  // Tham chiếu đến bảng products
        required: true
    },
    name: {
        type: String,
        required: true,
    },
    sku: {
        type: String,
        required: true,
        unique: true,  // Đảm bảo mã SKU là duy nhất
    },
    price: {
        type: Number,
        required: true,
    },
    importPrice: {
        type: Number,
        required: true,
    },
    salePrice: {
        type: Number,
        default: null,  // Có thể không có giá bán giảm
    },
    stockQuantity: {
        type: Number,
        required: true,
        min: 0,  // Số lượng tồn kho không thể âm
    },
    colorName: {
        type: String,
        required: true,
    },
    colorHexCode: {
        type: String,
        required: true,
    },
    colorImageUrl: {
        type: String,
        required: true,
    },
    materialVariation: {
        type: String,
        required: true,
    },

}, {
    timestamps: true,  // Tự động tạo createdAt và updatedAt
    versionKey: false   // Tắt trường __v                 
});
// Tạo model từ schema
const ProductVariation = mongoose.model('ProductVariation', productVariationSchema);

module.exports = ProductVariation;
