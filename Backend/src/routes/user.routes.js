const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { protect } = require('../middlewares/auth.middleware');

// API: Lấy danh sách người dùng
router.get("/", userController.getAllUsers);

// API: Lấy chi tiết người dùng
router.get("/:id", userController.getUserById);

// API: Khóa / mở khóa người dùng
router.patch("/:id/toggle-status", userController.toggleUserStatus);

// Cập nhật thông tin tài khoản
router.put('/update-profile', protect, userController.updateProfiles);

module.exports = router;
