const mongoose = require('mongoose');

// Định nghĩa Schema cho bảng "users"
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    dateBirth: {
        type: Date,
        required: true,
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'banned'],
        default: 'active',
    },
    avatarUrl: {
        type: String,
        required: false,
    },
    roleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role', // Tên của mô hình Role
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const User = mongoose.model('User', userSchema);
module.exports = User;
