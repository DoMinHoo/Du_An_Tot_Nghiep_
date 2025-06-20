// src/routes/order.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { protect, optionalProtect } = require('../middlewares/auth.middleware'); // Import middleware

// Route tạo đơn hàng (yêu cầu xác thực)
router.post('/', optionalProtect, orderController.createOrder);

// Các route khác (thêm protect nếu cần xác thực)
router.get('/', protect(['admin']), orderController.getOrders); // Chỉ admin
router.get('/:id', protect(['admin']), orderController.getOrderById);
router.put('/:id', protect(['admin']), orderController.updateOrder); // Chỉ admin
router.delete('/:id', protect(['admin']), orderController.deleteOrder); // Chỉ admin
router.get('/user/:userId', protect(), orderController.getOrdersByUser);


module.exports = router;