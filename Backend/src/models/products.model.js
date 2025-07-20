const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Tên sản phẩm, ví dụ: "Sofa", "Tủ kê TV", "Bàn trà - Bàn cafe"
    descriptionShort: { type: String, required: true }, // Mô tả ngắn, ví dụ: "Sofa hiện đại"
    descriptionLong: { type: String, required: true }, // Mô tả dài, ví dụ: "Sofa làm từ gỗ MFC, thiết kế hiện đại"
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }, // ID danh mục
    image: { type: [String], default: [] }, // Mảng đường dẫn hình ảnh chung
    totalPurchased: { type: Number, default: 0 }, // Tổng số lượng đã bán
    isDeleted: { type: Boolean, default: false }, // Trạng thái xóa
    status: {
        type: String,
        enum: ['active', 'hidden', 'sold_out'],
        default: 'active'
    } // Trạng thái sản phẩm
}, {
    timestamps: true,
    versionKey: false
});

module.exports = mongoose.model('Product', productSchema);