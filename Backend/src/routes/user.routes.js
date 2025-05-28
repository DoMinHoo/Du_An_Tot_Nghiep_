const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/user.controller');
const auth = require('../middlewares/auth.middleware');

// Công khai
router.post('/register', userCtrl.register);
router.post('/login', userCtrl.login);

// Cần xác thực
// router.use(auth);
// router.get('/', userCtrl.getUsers); // Quản lý người dùng
// router.get('/profile/me', userCtrl.getProfile);// Thống tin người dùng
// router.get('/:id', userCtrl.getUser);// Chi tiết người dùng
// router.put('/:id', userCtrl.updateUser);// Cập nhật người dùng
// router.patch('/:id/toggle-lock', userCtrl.toggleLock); // Khóa / mở khóa người dùng

module.exports = router;
