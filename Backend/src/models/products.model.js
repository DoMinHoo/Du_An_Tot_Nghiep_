const mongoose = require('mongoose');

// Định nghĩa Schema cho bảng "products"
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },// Tên sản phẩm
    descriptionShort: { type: String, required: true },// Miêu tả ngắn
    descriptionLong: { type: String, required: true }, // Miêu tả dài
    material: { type: String, required: true },// Chất liệu
    dimensions: { type: String, required: true },// Kích thước
    weight: { type: Number, required: true },// Khối lượng
    price: { type: Number, required: true },// Giá
    importPrice: { type: Number, required: true },// Giá nhập
    salePrice: { type: Number }, // Giá khuyến mãi
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }, // ID danh mục
    flashSale_discountedPrice: { type: Number },// Giá khuyến mãi
    flashSale_start: { type: Date },// Ngày bắt đầu khuyến mãi
    flashSale_end: { type: Date },// Ngày kết thúc khuyến mãi
    image: { type: [String], default: [] },// Mảng hình anh
    totalPurchased: { type: Number, default: 0 },// tong so luong da ban
    stock_quantity: { type: Number, default: 0 },// so luong trong kho
    isDeleted: { type: Boolean, default: false },// trang thai xoa
    status: {
        type: String,
        enum: ['active', 'hidden', 'sold_out'],
        default: 'active'
    } // trang thai san pham
}, {
    timestamps: true,
    versionKey: false
});

module.exports = mongoose.model('Product', productSchema);
