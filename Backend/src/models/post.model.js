const mongoose = require('mongoose');

// Định nghĩa schema cho bảng "posts"
const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,  // Đảm bảo slug là duy nhất
    },
    coverImage: {
        type: String,
        required: true,  // Đảm bảo ảnh bìa là bắt buộc
    },
    content: {
        type: String,  // Nội dung bài viết có thể là HTML hoặc Markdown
        required: true,
    },
    tags: {
        type: [String],  // Mảng các từ khoá
        default: [],
    },
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  // Liên kết đến bảng User (Mongoose sẽ tạo reference tự động)
        required: true,
    },
    published: {
        type: Boolean,
        default: false,  // Mặc định là chưa xuất bản
    },

}, {
    timestamps: true,  // Tự động tạo createdAt và updatedAt
    versionKey: false,  // Tắt trường __v
});

// Tạo mô hình "Post" từ schema
module.exports = mongoose.model('Post', postSchema);
