const mongoose = require('mongoose');

// Định nghĩa Schema cho bảng "roles"
const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },

}, {
    timestamps: true, // Tự động tạo createdAt & updatedAt
    versionKey: false // Tắt __v                                                    
});

const Role = mongoose.model('Role', roleSchema);
module.exports = Role;
