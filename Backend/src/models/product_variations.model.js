
const mongoose = require('mongoose');

const productVariationSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: { type: String, required: true  }, // Tên biến thể, ví dụ: "Sofa 180x85x69 cm", "Sofa góc 140x60x69 cm"
    sku: {
        type: String,
        required: true,
        unique: true // Đảm bảo mã SKU duy nhất, ví dụ: "SOFA001_180x85", "TV001_160x41"
    },
    dimensions: { type: String, required: true }, // Kích thước, ví dụ: "180x85x69 cm"
    basePrice: { type: Number, required: true }, // Giá cơ bản theo kích thước, ví dụ: 4,799,000 VND
    priceAdjustment: { type: Number, default: 0 }, // Điều chỉnh giá (nếu kích thước thay đổi), ví dụ: +500,000 VND
    finalPrice: { type: Number, required: true }, // Giá cuối cùng, tính bằng basePrice + priceAdjustment
    importPrice: { type: Number, required: true }, // Giá nhập theo biến thể
    salePrice: { type: Number, default: null }, // Giá khuyến mãi (nếu có)

    stockQuantity: {
        type: Number,
        required: true,
        min: 0
    }, // Số lượng tồn kho
    colorName: { type: String, required: true }, // Tên màu, ví dụ: "Trắng"
    colorHexCode: { type: String, required: true }, // Mã màu HEX, ví dụ: "#FFFFFF"
    colorImageUrl: { type: String, required: true }, // Đường dẫn ảnh màu
    material: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Material',
        required: true
    } // Biến thể chất liệu, ví dụ: "Gỗ MFC phủ bóng"
}, {
    timestamps: true,
    versionKey: false
});

const ProductVariation = mongoose.model('ProductVariation', productVariationSchema);
module.exports = ProductVariation;