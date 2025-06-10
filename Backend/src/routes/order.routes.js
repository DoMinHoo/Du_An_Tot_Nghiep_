const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');

// ✅ Route tạo đơn hàng (cho người dùng)
router.post('/', orderController.createOrder);

// Các route hiện tại
router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);
router.put('/:id', orderController.updateOrder);
router.delete('/:id', orderController.deleteOrder);
router.get('/user/:userId', orderController.getOrdersByUser);

module.exports = router;
