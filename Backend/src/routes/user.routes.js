const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { protect } = require("../middlewares/auth.middleware");


// API: Lấy thông tin profile
router.get("/profile", protect(), userController.getProfile);

// API: Lấy danh sách người dùng
router.get("/", userController.getAllUsers);

// API: Lấy chi tiết người dùng
router.get("/:id", userController.getUserById);

// API: Khóa / mở khóa người dùng
router.patch("/:id/toggle-status", userController.toggleUserStatus);

// API: Cập nhật thông tin người dùng
router.patch("/:id", protect(), userController.updateAdminUser);

// Cập nhật thông tin tài khoản
router.put('/update-profile', protect(), userController.updateAdminUser);




module.exports = router;
