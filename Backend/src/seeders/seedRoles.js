const mongoose = require('mongoose');
const Role = require('../models/Role');
require('dotenv').config();

// Kết nối với MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Failed to connect to MongoDB', err);
});

// Dữ liệu mẫu cho bảng roles
const roles = [
    {
        name: 'admin',
        description: 'Quản trị viên hệ thống, có quyền truy cập và quản lý tất cả các chức năng.',
    },
    {
        name: 'staff',
        description: 'Nhân viên làm việc với các chức năng liên quan đến quản lý và hỗ trợ người dùng.',
    },
    {
        name: 'client',
        description: 'Khách hàng, có quyền truy cập và mua hàng trên hệ thống.',
    }
];

// Hàm chèn dữ liệu vào MongoDB
const seedRoles = async () => {
    try {
        // Xóa dữ liệu cũ trước khi thêm mới
        await Role.deleteMany({});
        console.log('Deleted existing roles');

        // Chèn dữ liệu mới
        await Role.insertMany(roles);
        console.log('Seeded roles successfully');
    } catch (error) {
        console.error('Error seeding roles:', error);
    } finally {
        // Đóng kết nối MongoDB
        mongoose.connection.close();
    }
};

// Gọi hàm seedRoles
seedRoles();
