const mongoose = require('mongoose');

// Định nghĩa Schema cho bảng "categories"
const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,  // Tên danh mục là bắt buộc
    },
    description: {
        type: String,
        required: true,  // Mô tả danh mục là bắt buộc
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',  // Tham chiếu đến bảng Category (self-reference)
        default: null,  // Nếu không có danh mục cha, giá trị mặc định là null
    },

}, {
    timestamps: true, // Tự động tạo createdAt & updatedAt
    versionKey: false // Tắt __v
});

// Tạo và xuất model Category
module.exports = mongoose.model('Category', categorySchema);
