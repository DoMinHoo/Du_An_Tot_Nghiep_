// models/Banner.js
const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    link: {
        type: String,
        validate: {
            validator: function (v) {
                return /^https?:\/\/.+/.test(v) || v.startsWith('/');
            },
            message: props => `${props.value} không phải là một URL hợp lệ!`,
        },
        default: 'http://localhost:5173/',
    },
    isActive: { type: Boolean, default: true },
    position: {
        type: Number,
        unique: true, // ⚠️ chỉ dùng nếu bạn muốn đảm bảo cứng trong DB (sẽ lỗi nếu trùng)
        required: true,
    },
    collection: { type: String }, // 💥 thêm dòng này
}, { timestamps: true });


module.exports = mongoose.model('Banner', bannerSchema);
