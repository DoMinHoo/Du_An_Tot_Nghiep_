const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Tên sản phẩm, ví dụ: "Sofa", "Set Tủ Quần Áo Ubeda"
    brand: { type: String, required: true }, // Thương hiệu, ví dụ: "moho."
    descriptionShort: { type: String, required: true }, // Mô tả ngắn, ví dụ: "Sofa hiện đại", "Tủ quần áo tích hợp bàn trang điểm"
    descriptionLong: { type: String, required: true }, // Mô tả dài chung, ví dụ: "Sofa làm từ gỗ MFC", "Bộ tủ quần áo Ubeda kết hợp bàn trang điểm"
    material: { type: String, required: true }, // Chất liệu chung, ví dụ: "Gỗ MFC"
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }, // ID danh mục
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