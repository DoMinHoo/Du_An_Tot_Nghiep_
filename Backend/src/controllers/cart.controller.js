    const Order = require('../models/order.model');

    // ✅ GET /api/orders?status=&search=&page=&limit=
    exports.getOrders = async (req, res) => {
        try {
            const { page = 1, limit = 10, status, search } = req.query;
            const query = {};

            if (status) query.status = status;
            if (search) query.shippingAddress = { $regex: search, $options: 'i' };

            const total = await Order.countDocuments(query);
            const orders = await Order.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(Number(limit))
                .populate('userId');

            res.status(200).json({
                total,
                page: Number(page),
                totalPages: Math.ceil(total / limit),
                orders
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    };

    // ✅ GET /api/orders/:id
    exports.getOrderById = async (req, res) => {
        try {
            const order = await Order.findById(req.params.id).populate('userId');
            if (!order) return res.status(404).json({ message: 'Đơn hàng không tồn tại' });

            res.status(200).json(order);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    };

    // ✅ PUT /api/orders/:id
    exports.updateOrder = async (req, res) => {
        try {
            const { status, note } = req.body;

            const order = await Order.findById(req.params.id);
            if (!order) return res.status(404).json({ message: 'Đơn hàng không tồn tại' });

            if (status && status !== order.status) {
                order.status = status;
                order.statusHistory.push({
                    status,
                    note: note || '',
                    changedAt: new Date()
                });
            }

            await order.save();
            res.status(200).json({ message: 'Cập nhật đơn hàng thành công', order });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    };

    // ✅ DELETE /api/orders/:id
    exports.deleteOrder = async (req, res) => {
        try {
            const order = await Order.findByIdAndDelete(req.params.id);
            if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng để xoá' });

            res.status(200).json({ message: 'Đã xoá đơn hàng thành công' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    };

    // ✅ GET /api/orders/user/:userId
    exports.getOrdersByUser = async (req, res) => {
        try {
            const orders = await Order.find({ userId: req.params.userId })
                .sort({ createdAt: -1 });

            res.status(200).json(orders);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    };
