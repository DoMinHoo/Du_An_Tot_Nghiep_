    const moment = require('moment');
    const mongoose = require('mongoose');
    const Order = require('../models/order.model');
    const Product = require('../models/products.model');
    const ProductVariation = require('../models/product_variations.model');
    const User = require('../models/user.model');
    const Category = require('../models/category.model');
    const { getDateRange } = require('../untils/date');

    class StatisticsController {
    // Thống kê doanh thu
static async getRevenueStats(req, res) {
    try {
        const { period = 'day', startDate, endDate, chartType = 'line' } = req.query;

        // Validation
        if (!['day', 'month', 'year'].includes(period) && !(startDate && endDate)) {
            return res.status(400).json({ message: 'Khoảng thời gian không hợp lệ. Chỉ chấp nhận: day, month, year hoặc startDate/endDate.' });
        }
        if (startDate && endDate && (!moment(startDate).isValid() || !moment(endDate).isValid())) {
            return res.status(400).json({ message: 'startDate hoặc endDate không hợp lệ.' });
        }
        if (!['line', 'bar'].includes(chartType)) {
            return res.status(400).json({ message: 'Loại biểu đồ không hợp lệ. Chỉ chấp nhận: line, bar.' });
        }

        const { startDate: start, endDate: end, previousStartDate, previousEndDate } = getDateRange(period, startDate, endDate);

        // Doanh thu hiện tại
        const currentRevenue = await Order.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end }, status: 'completed', totalAmount: { $exists: true } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]).catch(err => [{ total: 0 }]);

        // Doanh thu kỳ trước
        const previousRevenue = await Order.aggregate([
            { $match: { createdAt: { $gte: previousStartDate, $lte: previousEndDate }, status: 'completed', totalAmount: { $exists: true } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]).catch(err => [{ total: 0 }]);

        const currentTotal = currentRevenue[0]?.total || 0; // Tổng doanh thu hiện tại
        const previousTotal = previousRevenue[0]?.total || 0; // Tổng doanh thu kỳ trước
        const growthRate = previousTotal ? ((currentTotal - previousTotal) / previousTotal * 100).toFixed(2) : 0; // tinh kieu gi:   

        // Tổng số đơn hàng theo trạng thái
        const orderStats = await Order.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end }, status: { $exists: true } } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]).catch(err => []);
        const orderStatus = { pending: 0, confirmed: 0, shipping: 0, completed: 0, canceled: 0 };
        orderStats.forEach(stat => { if (stat._id) orderStatus[stat._id] = stat.count || 0; });

        // Doanh thu trung bình
        const completedOrders = await Order.countDocuments({ createdAt: { $gte: start, $lte: end }, status: 'completed' }).catch(err => 0);
        const avgRevenuePerOrder = completedOrders ? (currentTotal / completedOrders).toFixed(2) : 0;
        // Thống kê số người thanh toán bằng COD và ZaloPay
        const paymentStats = await Order.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end }, status: 'completed', paymentMethod: { $in: ['cod', 'online_payment'] } } },
            {
                $group: {
                    _id: '$paymentMethod',
                    uniqueCustomers: { $addToSet: '$userId' } // Đếm số khách hàng duy nhất
                }
            },
            {
                $project: {
                    _id: 1,
                    count: { $size: '$uniqueCustomers' } // Đếm số lượng khách hàng duy nhất
                }
            }
        ]).catch(err => []);

        const paymentMethods = { cod: 0, zaloPay: 0 };
        paymentStats.forEach(stat => {
            if (stat._id === 'cod') paymentMethods.cod = stat.count || 0;
            if (stat._id === 'online_payment') paymentMethods.zaloPay = stat.count || 0; // Giả sử ZaloPay nằm trong online_payment
        });
        // Dữ liệu biểu đồ
        let groupBy, labelFormat, maxIntervals;
        if (period === 'day' || (startDate && endDate && moment(end).diff(moment(start), 'days') <= 1)) {
            groupBy = { $hour: '$createdAt' };
            labelFormat = i => `${i}h`;
            maxIntervals = 24;
        } else if (period === 'month' || (startDate && endDate && moment(end).diff(moment(start), 'months') <= 1)) {
            groupBy = { $dayOfMonth: '$createdAt' };
            labelFormat = i => `Ngày ${i}`;
            maxIntervals = moment(end).daysInMonth();
        } else {
            groupBy = { $month: '$createdAt' };
            labelFormat = i => `Tháng ${i}`;
            maxIntervals = 12;
        }

        const chartData = await Order.aggregate([
    { 
        $match: { 
            createdAt: { $gte: start, $lte: end }, 
            status: 'completed', 
            totalAmount: { $exists: true } 
        } 
    },
    { 
        $group: { 
            _id: { 
                $hour: { 
                    date: '$createdAt', 
                    timezone: 'Asia/Ho_Chi_Minh' // Chỉ định múi giờ +07
                } 
            }, 
            total: { $sum: '$totalAmount' } 
        } 
    },
    { $sort: { '_id': 1 } }
]).catch(err => []);

        const labels = [];
        const data = [];
        for (let i = 0; i < maxIntervals; i++) {
            const found = chartData.find(d => d._id === (i + 1));
            labels.push(labelFormat(i + 1));
            data.push(found ? found.total || 0 : 0);
        }

        const chart = {
            type: chartType,
            data: {
                labels,
                datasets: [{
                    label: 'Doanh thu',
                    data,
                    borderColor: chartType === 'line' ? '#4A90E2' : '#000000',
                    backgroundColor: chartType === 'line' ? 'rgba(74, 144, 226, 0.2)' : ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
                    fill: chartType === 'line',
                    borderWidth: chartType === 'bar' ? 1 : undefined
                }]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        };

        const result = {
            currentRevenue: currentTotal, // Tổng doanh thu hiện tại
            previousRevenue: previousTotal, // Tổng doanh thu kỳ trước
            growthRate: parseFloat(growthRate),// Tỷ lệ tăng trưởng
            orderStatus,
            avgRevenuePerOrder: parseFloat(avgRevenuePerOrder),// Doanh thu trung bình trên mỗi đơn hàng
            paymentMethods, // Số lượng khách hàng thanh toán bằng COD và ZaloPay
            chart
        };

        return res.json(result);
    } catch (error) {
        console.error('Lỗi khi lấy thống kê doanh thu:', error);
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
}

// Thống kê sản phẩm
static async getProductStats(req, res) {
    try {
        const { chartType = 'bar', period = 'month', startDate, endDate } = req.query;

        // Validation
        if (!['bar', 'pie'].includes(chartType)) {
            return res.status(400).json({ message: 'Loại biểu đồ không hợp lệ. Chỉ chấp nhận: bar, pie.' });
        }
        if (!['day', 'month', 'year'].includes(period) && !(startDate && endDate)) {
            return res.status(400).json({ message: 'Khoảng thời gian không hợp lệ. Chỉ chấp nhận: day, month, year hoặc startDate/endDate.' });
        }
        if (startDate && endDate && (!moment(startDate).isValid() || !moment(endDate).isValid())) {
            return res.status(400).json({ message: 'startDate hoặc endDate không hợp lệ.' });
        }

        let dateRange;
        try {
            dateRange = getDateRange(period, startDate, endDate);
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
        const { startDate: start, endDate: end } = dateRange;

        // Đếm sản phẩm
        const [activeProducts, inactiveProducts, flashSaleProducts] = await Promise.all([
            Product.countDocuments({ status: 'active', isDeleted: false }).catch(() => 0),
            Product.countDocuments({ status: { $in: ['hidden', 'sold_out'] }, isDeleted: false }).catch(() => 0),
            ProductVariation.countDocuments({
                $expr: { $and: [{ $gt: ['$salePrice', 0] }, { $lt: ['$salePrice', '$basePrice'] }] },
                isDeleted: false
            }).catch(() => 0),
        ]);

        // Top sản phẩm bán chạy (bỏ $limit hoặc tăng lên 100 nếu muốn hiển thị 100 sản phẩm)
        const topProducts = await Order.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end }, status: 'completed' } },
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'productvariations',
                    localField: 'items.variationId',
                    foreignField: '_id',
                    as: 'variation'
                }
            },
            { $unwind: { path: '$variation', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'products',
                    localField: 'variation.productId',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: { productId: '$variation.productId', productName: '$product.name' },
                    totalSold: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.salePrice'] } },
                    variationDetails: { $first: '$variation' }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 100 } // Tăng giới hạn lên 100 sản phẩm
        ]).catch(() => []);

        // Sản phẩm tồn kho thấp
        const lowStockProducts = await ProductVariation.find({
            stockQuantity: { $lt: 10 },
            isDeleted: false
        })
            .populate('productId', 'name image')
            .select('name stockQuantity productId colorImageUrl')
            .lean()
            .catch(() => []);

        // Danh mục phổ biến
        const popularCategories = await Order.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end }, status: 'completed' } },
            { $unwind: '$items' },
            { $lookup: { from: 'productvariations', localField: 'items.variationId', foreignField: '_id', as: 'variation' } },
            { $unwind: { path: '$variation', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'products', localField: 'variation.productId', foreignField: '_id', as: 'product' } },
            { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'categories', localField: 'product.categoryId', foreignField: '_id', as: 'category' } },
            { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: { categoryId: '$category._id', categoryName: '$category.name' },
                    totalSold: { $sum: '$items.quantity' }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 }
        ]).catch(() => []);

        // Tổng sản phẩm và tỷ lệ bán
        const [totalProducts, soldProducts] = await Promise.all([
            Product.countDocuments({ isDeleted: false }).catch(() => 0),
            Product.countDocuments({ totalPurchased: { $gt: 0 }, isDeleted: false }).catch(() => 0)
        ]);
        const unsoldProducts = totalProducts - soldProducts;
        const soldRatio = totalProducts ? (soldProducts / totalProducts * 100).toFixed(2) : 0;

        // Tỷ lệ tồn kho
        const totalStock = await ProductVariation.aggregate([
            { $match: { isDeleted: false } },
            { $group: { _id: null, totalStock: { $sum: '$stockQuantity' } } }
        ]).catch(() => [{ totalStock: 0 }]);
        const totalStockQuantity = totalStock[0]?.totalStock || 0;

        // Hàm tạo màu động
        const generateColors = (count) => {
            const colors = [];
            for (let i = 0; i < count; i++) {
                const r = Math.floor(Math.random() * 255);
                const g = Math.floor(Math.random() * 255);
                const b = Math.floor(Math.random() * 255);
                colors.push(`rgba(${r}, ${g}, ${b}, 0.7)`);
            }
            return colors;
        };

        // Biểu đồ
        const chart = {
            type: chartType,
            data: {
                labels: topProducts.length > 0 ? topProducts.map(p => p._id.productName || 'Không xác định') : ['Không có dữ liệu'],
                datasets: [{
                    label: 'Số lượng bán',
                    data: topProducts.length > 0 ? topProducts.map(p => p.totalSold || 0) : [0],
                    backgroundColor: topProducts.length > 0 ? generateColors(topProducts.length) : ['#CCCCCC'],
                    borderColor: chartType === 'bar' ? '#000000' : undefined,
                    borderWidth: chartType === 'bar' ? 1 : undefined
                }]
            },
            options: { 
                responsive: true, 
                scales: chartType === 'bar' ? { y: { beginAtZero: true } } : {},
                plugins: {
                    legend: {
                        display: chartType === 'pie' // Chỉ hiển thị legend cho biểu đồ pie
                    }
                }
            }
        };

        const message = topProducts.length === 0 && lowStockProducts.length === 0 && popularCategories.length === 0
            ? 'Không có dữ liệu đơn hàng trong khoảng thời gian này.'
            : undefined;

        const result = {
            message,
            productStats: {
                active: activeProducts,
                inactive: inactiveProducts,
                flashSale: flashSaleProducts,
                totalStock: totalStockQuantity // Tổng số lượng tồn kho
            },
            topProducts: topProducts.map(p => ({
                productId: p._id.productId,
                productName: p._id.productName || 'Không xác định',
                totalSold: p.totalSold || 0,
                totalRevenue: p.totalRevenue || 0,
                colorImageUrl: p.variationDetails?.colorImageUrl || null,
                dimensions: p.variationDetails?.dimensions || 'Không xác định',
                salePrice: p.variationDetails?.salePrice || p.variationDetails?.finalPrice || 0,
                colorName: p.variationDetails?.colorName || 'Không xác định',
            })),
            lowStockProducts: lowStockProducts.map(p => ({
                ...p,
                productImage: p.productId?.image?.[0] || null,
            })),
            popularCategories,// Danh mục phổ biến
            soldRatio: parseFloat(soldRatio),// Tỷ lệ bán
            unsoldProducts,// Số sản phẩm chưa bán
            chart
        };

        return res.json(result);
    } catch (error) {
        console.error('Lỗi khi lấy thống kê sản phẩm:', error);
        return res.status(500).json({ message: 'Lỗi server khi lấy thống kê sản phẩm.', error: error.message });
    }
}

    // Thống kê khách hàng
    static async getCustomerStats(req, res) {
        try {
        const { period = 'month', chartType = 'pie' } = req.query;
        if (!['day', 'month', 'year'].includes(period)) {
            return res.status(400).json({ message: 'Khoảng thời gian không hợp lệ. Chỉ chấp nhận: day, month, year.' });
        }
        if (!['pie', 'bar'].includes(chartType)) {
            return res.status(400).json({ message: 'Loại biểu đồ không hợp lệ. Chỉ chấp nhận: pie, bar.' });
        }

        const { startDate } = getDateRange(period);

        // Tổng số khách hàng
        const totalUsers = await User.countDocuments({ status: 'active' });

        // Khách hàng mới và quay lại
        const ordersByUser = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: '$userId', orderCount: { $sum: 1 } } }
        ]);
        const returningCustomers = ordersByUser.filter(o => o.orderCount > 1).length;
        const newCustomers = ordersByUser.length - returningCustomers;

        // Khách hàng mới trong tháng
        const newCustomersThisMonth = await User.countDocuments({ createdAt: { $gte: startDate }, status: 'active' });

        // Top 5 địa điểm
        const topLocations = await Order.aggregate([
            { $group: { _id: '$shippingAddress.province', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // Trạng thái đơn hàng
        const orderStatus = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        const statusStats = { pending: 0, confirmed: 0, shipping: 0, completed: 0, canceled: 0 };
        orderStatus.forEach(stat => { statusStats[stat._id] = stat.count; });

        const statusLabels = {
            pending: 'Chờ xác nhận',
            confirmed: 'Đã xác nhận',
            shipping: 'Đang giao',
            completed: 'Hoàn thành',
            canceled: 'Đã hủy'
        };

        const chart = {
            type: chartType,
            data: {
                labels: Object.keys(statusStats).map(key => statusLabels[key] || key),
                datasets: [{
                    label: 'Số lượng đơn hàng',
                    data: Object.values(statusStats),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
                    borderColor: chartType === 'bar' ? '#000000' : undefined,
                    borderWidth: chartType === 'bar' ? 1 : undefined
                }]
            },
            options: {
                responsive: true,
                scales: chartType === 'bar' ? { y: { beginAtZero: true } } : {}
            }
        };

        const result = {
            customerStats: { total: totalUsers, new: newCustomers, returning: returningCustomers },
            newCustomersThisMonth,
            topLocations,
            orderStatus: statusStats,
            chart
        };

        return res.json(result);
        } catch (error) {
        console.error('Lỗi khi lấy thống kê khách hàng:', error);
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
        }
    }

    // Thống kê chi tiết sản phẩm
    static async getProductDetailStats(req, res) {
        try {
        const { productId } = req.params;
        const { period = 'month', startDate, endDate } = req.query;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'ID sản phẩm không hợp lệ.' });
        }
        if (!['day', 'month', 'year'].includes(period) && !(startDate && endDate)) {
            return res.status(400).json({ message: 'Khoảng thời gian không hợp lệ.' });
        }
        if (startDate && endDate && (!moment(startDate).isValid() || !moment(endDate).isValid())) {
            return res.status(400).json({ message: 'startDate hoặc endDate không hợp lệ.' });
        }

        const { startDate: start, endDate: end } = getDateRange(period, startDate, endDate);

        const stats = await Order.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end }, status: 'completed' } },
            { $unwind: '$items' },
            {
            $lookup: {
                from: 'productvariations',
                localField: 'items.variationId',
                foreignField: '_id',
                as: 'variation'
            }
            },
            { $unwind: '$variation' },
            { $match: { 'variation.productId': new mongoose.Types.ObjectId(productId) } },
            {
            $group: {
                _id: null,
                totalQuantity: { $sum: '$items.quantity' },
                totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.salePrice'] } }
            }
            }
        ]);

        const product = await Product.findById(productId).select('name').lean();
        if (!product) {
            return res.status(404).json({ message: 'Sản phẩm không tồn tại.' });
        }

        const result = {
            productName: product.name,
            totalQuantity: stats[0]?.totalQuantity || 0,
            totalRevenue: stats[0]?.totalRevenue || 0
        };

        return res.json(result);
        } catch (error) {
        console.error('Lỗi khi lấy thống kê chi tiết sản phẩm:', error);
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
        }
    }

    // Thống kê chi tiết khách hàng
    static async getCustomerDetailStats(req, res) {
        try {
        const { userId } = req.params;
        const { period = 'month', startDate, endDate } = req.query;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'ID khách hàng không hợp lệ.' });
        }
        if (!['day', 'month', 'year'].includes(period) && !(startDate && endDate)) {
            return res.status(400).json({ message: 'Khoảng thời gian không hợp lệ.' });
        }
        if (startDate && endDate && (!moment(startDate).isValid() || !moment(endDate).isValid())) {
            return res.status(400).json({ message: 'startDate hoặc endDate không hợp lệ.' });
        }

        const { startDate: start, endDate: end } = getDateRange(period, startDate, endDate);

        const stats = await Order.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId), createdAt: { $gte: start, $lte: end } } },
            {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$totalAmount' }
            }
            }
        ]);

        const user = await User.findById(userId).select('name').lean();
        if (!user) {
            return res.status(404).json({ message: 'Khách hàng không tồn tại.' });
        }

        const statusStats = {
            pending: { count: 0, totalAmount: 0 },
            confirmed: { count: 0, totalAmount: 0 },
            shipping: { count: 0, totalAmount: 0 },
            completed: { count: 0, totalAmount: 0 },
            canceled: { count: 0, totalAmount: 0 }
        };
        stats.forEach(stat => {
            statusStats[stat._id] = { count: stat.count, totalAmount: stat.totalAmount };
        });

        const result = {
            customerName: user.name,
            statusStats
        };

        return res.json(result);
        } catch (error) {
        console.error('Lỗi khi lấy thống kê chi tiết khách hàng:', error);
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
        }
    }
    }

    module.exports = StatisticsController;