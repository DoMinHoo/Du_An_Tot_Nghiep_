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
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

const Role = mongoose.model('Role', roleSchema);
module.exports = Role;
