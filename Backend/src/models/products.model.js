const mongoose = require('mongoose');

// Định nghĩa Schema cho bảng "products"
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true, // Tên sản phẩm là bắt buộc
    },
    descriptionShort: {
        type: String,
        required: true, // Mô tả ngắn là bắt buộc
    },
    descriptionLong: {
        type: String,
        required: true, // Mô tả chi tiết là bắt buộc
    },
    material: {
        type: String,
        required: true, // Chất liệu là bắt buộc
    },
    dimensions: {
        type: String,
        required: true, // Kích thước là bắt buộc
    },
    weight: {
        type: Number,
        required: true, // Cân nặng là bắt buộc
    },
    price: {
        type: Number,
        required: true, // Giá gốc là bắt buộc
    },
    importPrice: {
        type: Number,
        required: true, // Giá nhập là bắt buộc
    },
    salePrice: {
        type: Number,
        required: false, // Giá bán giảm giá là tùy chọn
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category', // Tham chiếu đến bảng Categories
        required: true, // ID danh mục là bắt buộc
    },
    flashSale_discountedPrice: {
        type: Number,
        required: false, // Giá flash sale là tùy chọn
    },
    flashSale_start: {
        type: Date,
        required: false, // Thời gian bắt đầu flash sale là tùy chọn
    },
    flashSale_end: {
        type: Date,
        required: false, // Thời gian kết thúc flash sale là tùy chọn
    },
    images: {
        type: [String], // Danh sách URL hình ảnh
        required: true, // Hình ảnh là bắt buộc
    },
    totalPurchased: {
        type: Number,
        default: 0, // Mặc định là 0
    },
    status: {
        type: String,
        enum: ['active', 'hidden', 'sold_out'], // Trạng thái sản phẩm
        default: 'active', // Mặc định là active
    },
    createdAt: {
        type: Date,
        default: Date.now, // Mặc định là thời gian hiện tại
    },
    updatedAt: {
        type: Date,
        default: Date.now, // Mặc định là thời gian hiện tại
    },
});

// Tạo mô hình và xuất khẩu
module.exports = mongoose.model('Product', productSchema);
