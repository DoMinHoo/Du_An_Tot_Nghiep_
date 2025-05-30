// controllers/order.controller.js
const Order = require('../models/order.model');
const mongoose = require('mongoose');
// Lấy danh sách đơn hàng (loc, phan trang)
exports.getOrders = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            status,
            userId
        } = req.query;

        const filter = {};

        if (status) {
            filter.status = status;
        }

        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
            filter.userId = userId;
        }

        if (search) {
            filter['items.name'] = { $regex: search, $options: 'i' };
        }

        const orders = await Order.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .populate('userId')
            .populate('items.productId')
            .populate('items.variationId');

        const total = await Order.countDocuments(filter);

        res.status(200).json({
            data: orders,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
// Lấy chi tiết đơn hàng
exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid order ID' });
        }

        const order = await Order.findById(id)
            .populate('userId')
            .populate('items.productId')
            .populate('items.variationId');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json(order);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
// Cập nhật đơn hàng
exports.updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, note } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid order ID' });
        }

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (status && order.status !== status) {
            order.status = status;
            order.statusHistory.push({ status, note });
        }

        await order.save();

        res.status(200).json({ message: 'Order updated', order });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
// Xóa đơn hàng
exports.deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid order ID' });
        }

        const result = await Order.findByIdAndDelete(id);

        if (!result) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json({ message: 'Order permanently deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
// Lấy danh sách đơn hàng theo người dùng
exports.getOrdersByUser = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        const orders = await Order.find({ userId })
            .sort({ createdAt: -1 })
            .populate('items.productId')
            .populate('items.variationId');

        res.status(200).json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
