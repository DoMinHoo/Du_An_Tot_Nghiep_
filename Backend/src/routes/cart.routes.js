const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { protect, optionalProtect } = require('../middlewares/auth.middleware');

// Thêm sản phẩm vào giỏ hàng
router.post('/add', optionalProtect, cartController.addToCart);

// Cập nhật số lượng sản phẩm
router.put('/update', optionalProtect, cartController.updateCartItem);

// Xóa một sản phẩm khỏi giỏ hàng
router.delete('/remove/:variationId', optionalProtect, cartController.removeCartItem);

// Xóa nhiều sản phẩm khỏi giỏ hàng
router.delete('/remove-multiple', optionalProtect, cartController.deleteMultipleCartItems);

// Xóa toàn bộ giỏ hàng
router.delete('/clear', optionalProtect, cartController.clearCart);

// Lấy thông tin giỏ hàng
router.get('/', optionalProtect, cartController.getCart);

// Hợp nhất giỏ hàng khi đăng nhập
router.post('/merge', protect(), cartController.mergeCart);

module.exports = router;