const Order = require('../models/order.model');
const User = require('../models/user.model');
const Product = require('../models/products.model');
const ProductVariation = require('../models/product_variations.model');
const Category = require('../models/category.model');
const moment = require('moment');
const { validationResult } = require('express-validator');

/// Hàm validate chung cho các tham số query
const validateQuery = (req) => {
    console.log('Received query params:', req.query); // Log để debug
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return { isValid: false, errors: errors.array() };
    }

    let { startDate, endDate, groupBy = 'day' } = req.query;
    let dateFilter = {};

    // Kiểm tra định dạng ngày
    if (startDate && endDate) {
        if (!moment(startDate, 'YYYY-MM-DD', true).isValid() || !moment(endDate, 'YYYY-MM-DD', true).isValid()) {
            return { isValid: false, errors: [{ msg: 'Định dạng ngày không hợp lệ (YYYY-MM-DD)' }] };
        }
        // Điều chỉnh startDate và endDate khi groupBy = month
        if (groupBy === 'month') {
            startDate = moment(startDate).startOf('month').format('YYYY-MM-DD');
            endDate = moment(endDate).endOf('month').format('YYYY-MM-DD');
        }
        dateFilter = {
            createdAt: {
                $gte: moment(startDate).startOf('day').toDate(),
                $lte: moment(endDate).endOf('day').toDate(),
            },
        };
    }

    // Kiểm tra groupBy
    const validGroupBy = ['day', 'month'];
    if (!validGroupBy.includes(groupBy)) {
        return { isValid: false, errors: [{ msg: 'groupBy phải là day hoặc month' }] };
    }

    const dateFormat = groupBy === 'day' ? '%Y-%m-%d' : '%Y-%m';

    return { isValid: true, dateFilter, dateFormat, adjustedDates: { startDate, endDate } };
};

// 1. Thống kê tổng quát
const getOverviewStats = async (req, res) => {
    try {
        const validation = validateQuery(req);
        if (!validation.isValid) {
            return res.status(400).json({ success: false, message: 'Dữ liệu đầu vào không hợp lệ', errors: validation.errors });
        }
        const { dateFilter, dateFormat } = validation;

        // Tổng số đơn hàng
        const totalOrders = await Order.countDocuments(dateFilter);

        // Tổng doanh thu (chỉ tính đơn completed)
        const totalRevenue = await Order.aggregate([
            { $match: { ...dateFilter, status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]);

        // Tổng số khách hàng
        const totalUsers = await User.countDocuments();

        // Tổng số sản phẩm đã bán
        const totalProductsSold = await Order.aggregate([
            { $match: { ...dateFilter, status: 'completed' } },
            { $unwind: '$items' },
            { $group: { _id: null, total: { $sum: '$items.quantity' } } },
        ]);

        // Doanh thu theo thời gian
        const revenueByTime = await Order.aggregate([
            { $match: { ...dateFilter, status: 'completed' } },
            {
                $group: {
                    _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
                    total: { $sum: '$totalAmount' },
                },
            },
            { $sort: { _id: 1 } },
            { $project: { time: '$_id', total: 1, _id: 0 } },
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalOrders,
                totalRevenue: totalRevenue[0]?.total || 0,
                totalUsers,
                totalProductsSold: totalProductsSold[0]?.total || 0,
                revenueByTime,
            },
        });
    } catch (error) {
        console.error('Lỗi thống kê tổng quát:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: process.env.NODE_ENV === 'production' ? 'Lỗi nội bộ' : error.message,
        });
    }
};

// 2. Thống kê đơn hàng
const getOrderStats = async (req, res) => {
    try {
        const validation = validateQuery(req);
        if (!validation.isValid) {
            return res.status(400).json({ success: false, message: 'Dữ liệu đầu vào không hợp lệ', errors: validation.errors });
        }
        const { dateFilter, dateFormat } = validation;

        // Tổng đơn hàng theo trạng thái
        const ordersByStatus = await Order.aggregate([
            { $match: dateFilter },
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $project: { status: '$_id', count: 1, _id: 0 } },
        ]);

        // Đơn hàng theo thời gian
        const ordersByTime = await Order.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
            { $project: { time: '$_id', count: 1, _id: 0 } },
        ]);

        // Sản phẩm phổ biến trong đơn hàng
        const popularProducts = await Order.aggregate([
            { $match: dateFilter },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.variationId',
                    totalQuantity: { $sum: '$items.quantity' },
                },
            },
            {
                $lookup: {
                    from: 'productvariations',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'variation',
                },
            },
            { $unwind: '$variation' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'variation.productId',
                    foreignField: '_id',
                    as: 'product',
                },
            },
            { $unwind: '$product' },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 },
            {
                $project: {
                    productName: '$product.name',
                    variationName: '$variation.name',
                    totalQuantity: 1,
                    _id: 0,
                },
            },
        ]);

        // Giá trị đơn hàng trung bình
        const avgOrderValue = await Order.aggregate([
            { $match: { ...dateFilter, status: 'completed' } },
            { $group: { _id: null, avg: { $avg: '$totalAmount' } } },
        ]);

        res.status(200).json({
            success: true,
            data: {
                ordersByStatus,
                ordersByTime,
                popularProducts,
                avgOrderValue: avgOrderValue[0]?.avg || 0,
            },
        });
    } catch (error) {
        console.error('Lỗi thống kê đơn hàng:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: process.env.NODE_ENV === 'production' ? 'Lỗi nội bộ' : error.message,
        });
    }
};

// 3. Thống kê sản phẩm
const getProductStats = async (req, res) => {
    try {
        const validation = validateQuery(req);
        if (!validation.isValid) {
            return res.status(400).json({ success: false, message: 'Dữ liệu đầu vào không hợp lệ', errors: validation.errors });
        }
        const { dateFilter, dateFormat } = validation;

        // Sản phẩm bán chạy nhất
        const bestSellingProducts = await Order.aggregate([
            { $match: dateFilter },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.variationId',
                    totalQuantity: { $sum: '$items.quantity' },
                },
            },
            {
                $lookup: {
                    from: 'productvariations',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'variation',
                },
            },
            { $unwind: '$variation' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'variation.productId',
                    foreignField: '_id',
                    as: 'product',
                },
            },
            { $unwind: '$product' },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 },
            {
                $project: {
                    productName: '$product.name',
                    variationName: '$variation.name',
                    totalQuantity: 1,
                    colorImageUrl: '$variation.colorImageUrl',
                    _id: 0,
                },
            },
        ]);

        // Sản phẩm tồn kho thấp
        const lowStockProducts = await ProductVariation.find({
            stockQuantity: { $lte: 10 },
        })
            .populate('productId', 'name')
            .select('name productId stockQuantity colorImageUrl')
            .lean();

        // Sản phẩm bị hoàn trả nhiều (giả sử hủy là hoàn trả)
        const highReturnProducts = await Order.aggregate([
            { $match: { ...dateFilter, status: 'canceled' } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.variationId',
                    totalReturns: { $sum: '$items.quantity' },
                },
            },
            {
                $lookup: {
                    from: 'productvariations',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'variation',
                },
            },
            { $unwind: '$variation' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'variation.productId',
                    foreignField: '_id',
                    as: 'product',
                },
            },
            { $unwind: '$product' },
            { $sort: { totalReturns: -1 } },
            { $limit: 10 },
            {
                $project: {
                    productName: '$product.name',
                    variationName: '$variation.name',
                    totalReturns: 1,
                    colorImageUrl: '$variation.colorImageUrl',
                    _id: 0,
                },
            },
        ]);

        // Sản phẩm không bán được
        const unsoldProducts = await ProductVariation.aggregate([
            {
                $lookup: {
                    from: 'orders',
                    let: { variationId: '$_id' },
                    pipeline: [
                        { $match: dateFilter },
                        { $unwind: '$items' },
                        { $match: { 'items.variationId': { $eq: '$$variationId' } } },
                    ],
                    as: 'orders',
                },
            },
            { $match: { orders: { $size: 0 } } },
            {
                $lookup: {
                    from: 'products',
                    localField: 'productId',
                    foreignField: '_id',
                    as: 'product',
                },
            },
            { $unwind: '$product' },
            { $limit: 10 },
            {
                $project: {
                    productName: '$product.name',
                    variationName: '$name',
                    stockQuantity: 1,
                    colorImageUrl: 1,
                    _id: 0,
                },
            },
        ]);

        // Số lượng sản phẩm đã bán theo thời gian
        const productsSoldByTime = await Order.aggregate([
            { $match: dateFilter },
            { $unwind: '$items' },
            {
                $group: {
                    _id: {
                        time: { $dateToString: { format: dateFormat, date: '$createdAt' } },
                        variationId: '$items.variationId',
                    },
                    totalQuantity: { $sum: '$items.quantity' },
                },
            },
            {
                $lookup: {
                    from: 'productvariations',
                    localField: '_id.variationId',
                    foreignField: '_id',
                    as: 'variation',
                },
            },
            { $unwind: '$variation' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'variation.productId',
                    foreignField: '_id',
                    as: 'product',
                },
            },
            { $unwind: '$product' },
            { $sort: { '_id.time': 1 } },
            {
                $project: {
                    time: '$_id.time',
                    productName: '$product.name',
                    variationName: '$variation.name',
                    totalQuantity: 1,
                    colorImageUrl: '$variation.colorImageUrl',
                    _id: 0,
                },
            },
        ]);

        res.status(200).json({
            success: true,
            data: {
                bestSellingProducts,
                lowStockProducts,
                highReturnProducts,
                unsoldProducts,
                productsSoldByTime,
            },
        });
    } catch (error) {
        console.error('Lỗi thống kê sản phẩm:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: process.env.NODE_ENV === 'production' ? 'Lỗi nội bộ' : error.message,
        });
    }
};

// 4. Thống kê người dùng / khách hàng
const getUserStats = async (req, res) => {
    try {
        const validation = validateQuery(req);
        if (!validation.isValid) {
            return res.status(400).json({ success: false, message: 'Dữ liệu đầu vào không hợp lệ', errors: validation.errors });
        }
        const { dateFilter } = validation;

        // Số lượng khách hàng mới
        const newUsers = await User.countDocuments(dateFilter);

        // Khách hàng hoạt động tích cực nhất
        const activeUsers = await Order.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: '$userId',
                    totalOrders: { $sum: 1 },
                    totalSpent: { $sum: '$totalAmount' },
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            { $unwind: '$user' },
            { $sort: { totalOrders: -1 } },
            { $limit: 10 },
            {
                $project: {
                    name: '$user.name',
                    email: '$user.email',
                    totalOrders: 1,
                    totalSpent: 1,
                    _id: 0,
                },
            },
        ]);

        // Lịch sử mua hàng của khách
        const userPurchaseHistory = await Order.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: '$userId',
                    orders: { $push: { orderCode: '$orderCode', totalAmount: '$totalAmount', createdAt: '$createdAt' } },
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            { $unwind: '$user' },
            {
                $project: {
                    name: '$user.name',
                    email: '$user.email',
                    orders: 1,
                    _id: 0,
                },
            },
        ]);

        // Khu vực khách hàng tập trung
        const userByRegion = await User.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: '$address',
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
            { $project: { region: '$_id', count: 1, _id: 0 } },
        ]);

        res.status(200).json({
            success: true,
            data: {
                newUsers,
                activeUsers,
                userPurchaseHistory,
                userByRegion,
            },
        });
    } catch (error) {
        console.error('Lỗi thống kê người dùng:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: process.env.NODE_ENV === 'production' ? 'Lỗi nội bộ' : error.message,
        });
    }
};

// 5. Thống kê doanh thu
const getRevenueStats = async (req, res) => {
    try {
        const validation = validateQuery(req);
        if (!validation.isValid) {
            return res.status(400).json({ success: false, message: 'Dữ liệu đầu vào không hợp lệ', errors: validation.errors });
        }
        const { dateFilter, dateFormat } = validation;

        // Doanh thu theo thời gian
        const revenueByTime = await Order.aggregate([
            { $match: { ...dateFilter, status: 'completed' } },
            {
                $group: {
                    _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
                    total: { $sum: '$totalAmount' },
                },
            },
            { $sort: { _id: 1 } },
            { $project: { time: '$_id', total: 1, _id: 0 } },
        ]);

        // Doanh thu theo danh mục sản phẩm
        const revenueByCategory = await Order.aggregate([
            { $match: { ...dateFilter, status: 'completed' } },
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'productvariations',
                    localField: 'items.variationId',
                    foreignField: '_id',
                    as: 'variation',
                },
            },
            { $unwind: '$variation' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'variation.productId',
                    foreignField: '_id',
                    as: 'product',
                },
            },
            { $unwind: '$product' },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'product.categoryId',
                    foreignField: '_id',
                    as: 'category',
                },
            },
            { $unwind: '$category' },
            {
                $group: {
                    _id: '$category.name',
                    total: { $sum: { $multiply: ['$items.quantity', '$items.salePrice'] } },
                },
            },
            { $sort: { total: -1 } },
            { $project: { category: '$_id', total: 1, _id: 0 } },
        ]);

        // Doanh thu theo hình thức thanh toán
        const revenueByPaymentMethod = await Order.aggregate([
            { $match: { ...dateFilter, status: 'completed' } },
            {
                $group: {
                    _id: '$paymentMethod',
                    total: { $sum: '$totalAmount' },
                },
            },
            { $project: { paymentMethod: '$_id', total: 1, _id: 0 } },
        ]);

        res.status(200).json({
            success: true,
            data: {
                revenueByTime,
                revenueByCategory,
                revenueByPaymentMethod,
            },
        });
    } catch (error) {
        console.error('Lỗi thống kê doanh thu:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: process.env.NODE_ENV === 'production' ? 'Lỗi nội bộ' : error.message,
        });
    }
};

module.exports = {
    getOverviewStats,
    getOrderStats,
    getProductStats,
    getUserStats,
    getRevenueStats,
};