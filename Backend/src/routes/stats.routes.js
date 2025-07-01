    const express = require('express');
    const router = express.Router();
    const { query } = require('express-validator');
    const {
    getOverviewStats,
    getOrderStats,
    getProductStats,
    getUserStats,
    getRevenueStats,
    } = require('../controllers/statsController');
    const { protect } = require('../middlewares/auth.middleware');

    // Middleware xác thực đầu vào cho các tham số query
    const validateQueryParams = [
    query('startDate')
        .optional()
        .isDate({ format: 'YYYY-MM-DD' })
        .withMessage('startDate phải có định dạng YYYY-MM-DD'),
    query('endDate')
        .optional()
        .isDate({ format: 'YYYY-MM-DD' })
        .withMessage('endDate phải có định dạng YYYY-MM-DD'),
    query('groupBy')
        .optional()
        .isIn(['day', 'week', 'month'])
        .withMessage('groupBy phải là day, week, hoặc month'),
    ];

    // Middleware để thêm header chống cache
    const noCache = (req, res, next) => {
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
        'Surrogate-Control': 'no-store',
    });
    next();
    };

    // Định nghĩa các route thống kê
    router.get(
    '/overview',
    protect(['admin']),
    noCache,
    validateQueryParams,
    getOverviewStats
    );

    router.get(
    '/orders',
    protect(['admin']),
    noCache,
    validateQueryParams,
    getOrderStats
    );

    router.get(
    '/products',
    protect(['admin']),
    noCache,
    validateQueryParams,
    getProductStats
    );

    router.get(
    '/users',
    protect(['admin']),
    noCache,
    validateQueryParams,
    getUserStats
    );

    router.get(
    '/revenue',
    protect(['admin']),
    noCache,
    validateQueryParams,
    getRevenueStats
    );

    module.exports = router;