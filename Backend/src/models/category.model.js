const mongoose = require('mongoose');
const { Schema } = mongoose;

const categorySchema = new Schema({
name: { type: String, required: true },
description: String,

slug: { type: String, required: true, unique: true }, // SEO URL
metaTitle: String,
metaDescription: String,

parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null }, // Danh mục cha

isActive: { type: Boolean, default: true }, // Hiển thị hay không

// Bổ sung ảnh đại diện cho danh mục (optional)
image: { type: String }, // URL ảnh đại diện

// Các thuộc tính hỗ trợ UI hoặc phân loại
order: { type: Number, default: 0 }, // Thứ tự hiển thị
level: { type: Number, default: 1 }, // Cấp độ (root = 1)
}, {
timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Category', categorySchema);

// {
//     _id: ObjectId,
//     name: String,                 // Tên danh mục (VD: "Bàn trà")
//     slug: String,                 // Đường dẫn SEO (VD: "ban-tra")
//     description: String,          // Mô tả chi tiết
//     image: String,                // Ảnh đại diện danh mục

//     parent: ObjectId | null,      // ID của danh mục cha
//     level: Number,                // Cấp độ phân cấp (1: gốc, 2: con,...)

//     order: Number,                // Thứ tự hiển thị
//     isActive: Boolean,            // Có hiển thị trên website không

//     metaTitle: String,            // SEO: tiêu đề
//     metaDescription: String,      // SEO: mô tả

//     created_at: Date,
//     updated_at: Date
//   }
