const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { protect, optionalProtect } = require('../middlewares/auth.middleware'); // Import middleware

// Route tạo đơn hàng (yêu cầu xác thực)
router.post('/', optionalProtect, orderController.createOrder);
router.get("/status", orderController.getOrderStatus);

// Các route khác
router.get('/', protect(['admin']), orderController.getOrders); // Chỉ admin
router.get('/:id', protect(), orderController.getOrderById);
router.put('/:id', protect(), orderController.updateOrder); // Ai đăng nhập cũng có thể sửa
router.delete('/:id', protect(['admin']), orderController.deleteOrder); // Chỉ admin
router.get('/user/:userId', protect(), orderController.getOrdersByUser);



module.exports = router;
