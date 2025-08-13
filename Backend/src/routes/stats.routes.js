const express = require('express');
const router = express.Router();
const StatisticsController = require('../controllers/statsController');
const { protect } = require('../middlewares/auth.middleware');

router.get('/revenue', protect(['admin']), StatisticsController.getRevenueStats); // Lấy thống kê doanh thu
router.get('/products', protect(['admin']), StatisticsController.getProductStats); // Lấy thống kê sản phẩm
router.get('/products/:productId', protect(['admin']), StatisticsController.getProductDetailStats); // Lấy thống kê chi tiết sản phẩm
router.get('/customers', protect(['admin']), StatisticsController.getCustomerStats); // Lấy thống kê khách hàng
router.get('/customers/:userId', protect(['admin']), StatisticsController.getCustomerDetailStats); // Lấy thống kê chi tiết khách hàng

module.exports = router;