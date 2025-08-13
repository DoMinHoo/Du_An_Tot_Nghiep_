const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },

}, {
    timestamps: true, // Tự động tạo createdAt & updatedAt
    versionKey: false // Tắt __v                                                   
});
userSchema.index({ email: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: 1 });
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
