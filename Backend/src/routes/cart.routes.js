// routes/cart.route.js
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Thêm sản phẩm vào giỏ hàng
router.post('/add', authMiddleware, cartController.addToCart);

// Cập nhật số lượng sản phẩm
router.put('/update', authMiddleware, cartController.updateCartItem);

// Xóa một sản phẩm khỏi giỏ hàng
router.delete('/remove/:productId', authMiddleware, cartController.removeCartItem);

// Xóa toàn bộ giỏ hàng
router.delete('/clear', authMiddleware, cartController.clearCart);

// Lấy thông tin giỏ hàng
router.get('/', authMiddleware, cartController.getCart);

module.exports = router;