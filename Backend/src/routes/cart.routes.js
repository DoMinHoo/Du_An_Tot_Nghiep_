// src/routes/cart.route.js
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { protect } = require('../middlewares/auth.middleware');
// Thêm sản phẩm vào giỏ hàng
router.post('/add', protect(), cartController.addToCart);

// Cập nhật số lượng sản phẩm
router.put('/update', protect(), cartController.updateCartItem);

// Xóa một sản phẩm khỏi giỏ hàng
router.delete('/remove/:productId', protect(), cartController.removeCartItem);

// Xóa toàn bộ giỏ hàng
router.delete('/clear', protect(), cartController.clearCart);

// Lấy thông tin giỏ hàng
router.get('/', protect(), cartController.getCart);

module.exports = router