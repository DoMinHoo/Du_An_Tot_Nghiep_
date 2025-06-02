    const express = require('express');
    const router = express.Router();
    const orderController = require('../controllers/order.controller');

    router.get('/', orderController.getOrders); // Lấy danh sách đơn hàng
    router.get('/:id', orderController.getOrderById); // Lấy chi tiết đơn hàng theo ID
    router.put('/:id', orderController.updateOrder);//  Cập nhật đồn hàng
    router.delete('/:id', orderController.deleteOrder);// Xóa mềm đồn hàng
    router.get('/user/:userId', orderController.getOrdersByUser);  // Lấy danh sách đồn hàng theo người dùng

    module.exports = router;
