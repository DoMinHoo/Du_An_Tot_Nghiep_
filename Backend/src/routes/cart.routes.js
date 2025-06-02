const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');

router.get('/', orderController.getOrders);                      // Lọc, phân trang
router.get('/:id', orderController.getOrderById);               // Chi tiết đơn
router.put('/:id', orderController.updateOrder);                // Cập nhật
router.delete('/:id', orderController.deleteOrder);             // Xoá
router.get('/user/:userId', orderController.getOrdersByUser);   // Đơn theo user

module.exports = router;
