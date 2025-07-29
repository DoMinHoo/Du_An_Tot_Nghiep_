// src/controllers/order.controller.js
const mongoose = require('mongoose');

const Promotion = require("../models/promotion.model");
// Lấy danh sách đơn hàng (loc, phan trang)

const Order = require('../models/order.model');
const Cart = require('../models/cart.model');
const ProductVariation = require('../models/product_variations.model');
const Product = require('../models/products.model');
const User = require('../models/user.model');
const { sendPaymentSuccessEmail, sendOrderSuccessEmail, sendOrderStatusUpdateEmail } = require('../untils/sendPaymentSuccessEmail'); // Sửa lại impor
const Notification = require('../models/notification');


// Tạo mã đơn hàng ngẫu nhiên
const generateOrderCode = () => {
    return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
};

// Lấy danh sách đơn hàng (lọc, phân trang)

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

        if (userId && mongoose.isValidObjectId(userId)) {
            filter.userId = userId;
        }

        if (search) {
            filter.$or = [
                { customerName: { $regex: search, $options: 'i' } },
                { orderCode: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const orders = await Order.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .populate({
                path: 'userId',
                select: 'name email'
            })
            .populate({
                path: 'items.variationId',
                select: 'name sku dimensions finalPrice salePrice stockQuantity colorName colorHexCode colorImageUrl materialVariation',
                populate: {
                    path: 'productId',
                    select: 'name brand descriptionShort image',
                    match: { isDeleted: false, status: 'active' }
                }
            });

        // Nhóm dữ liệu theo productId
        const groupedOrders = orders.map(order => {
            const groupedItems = order.items.reduce((acc, item) => {
                if (!item.variationId || !item.variationId.productId) {
                    return acc; // Bỏ qua các item không hợp lệ
                }
                const productId = item.variationId.productId._id.toString();
                let group = acc.find(g => g.productId === productId);
                if (!group) {
                    group = {
                        productId,
                        name: item.variationId.productId.name,
                        brand: item.variationId.productId.brand,
                        descriptionShort: item.variationId.productId.descriptionShort,
                        image: item.variationId.productId.image,
                        variations: [],
                        totalQuantity: 0,
                        totalPrice: 0
                    };
                    acc.push(group);
                }
                group.variations.push({
                    variationId: item.variationId._id,
                    name: item.variationId.name,
                    sku: item.variationId.sku,
                    dimensions: item.variationId.dimensions,
                    finalPrice: item.variationId.finalPrice,
                    salePrice: item.salePrice,
                    stockQuantity: item.variationId.stockQuantity,
                    colorName: item.variationId.colorName,
                    colorHexCode: item.variationId.colorHexCode,
                    colorImageUrl: item.variationId.colorImageUrl,
                    materialVariation: item.variationId.materialVariation,
                    quantity: item.quantity,
                    subtotal: item.salePrice * item.quantity
                });
                group.totalQuantity += item.quantity;
                group.totalPrice += item.salePrice * item.quantity;
                return acc;
            }, []);

            return {
                ...order.toObject(),
                items: groupedItems
            };
        });

        const total = await Order.countDocuments(filter);

        res.status(200).json({
            success: true,
            message: 'Lấy danh sách đơn hàng thành công',
            data: groupedOrders,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('Lỗi getOrders:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

// Tạo đơn hàng từ giỏ hàng
exports.createOrder = async (req, res) => {
    try {
        const { shippingAddress, paymentMethod, cartId, finalAmount, couponCode, selectedItems, shippingFee, items } = req.body;

        // Xác thực địa chỉ giao hàng
        const { fullName, phone, email, addressLine, street, province, district, ward } = shippingAddress || {};
        if (!fullName || !phone || !email || !addressLine || !street || !province || !district || !ward) {
            return res.status(400).json({
                success: false,
                message: 'Địa chỉ giao hàng chưa đầy đủ',
            });
        }

        // Xác thực phương thức thanh toán
        if (!['cod', 'bank_transfer', 'online_payment'].includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: 'Phương thức thanh toán không hợp lệ',
            });
        }

        // Xác thực danh sách items
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Danh sách sản phẩm không hợp lệ hoặc trống',
            });
        }

        let selectedCartItems = [];
        if (cartId) {
            // Xử lý khi mua từ giỏ hàng
            const cart = await Cart.findById(cartId).populate({
                path: 'items.variationId',
                select: 'finalPrice salePrice stockQuantity productId colorName material colorImageUrl',
                populate: {
                    path: 'productId',
                    select: 'name images',
                    match: { isDeleted: false, status: 'active' },
                },
            });

            if (!cart || cart.items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Giỏ hàng trống hoặc không tồn tại',
                });
            }

            selectedCartItems = cart.items.filter((item) =>
                selectedItems.includes(item.variationId._id.toString())
            );

            if (selectedCartItems.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Không tìm thấy sản phẩm được chọn trong giỏ hàng',
                });
            }
        } else {
            // Xử lý khi mua trực tiếp (isDirectPurchase)
            const populatedItems = await ProductVariation.find({
                _id: { $in: items.map((item) => item.variationId) },
            }).populate({
                path: 'productId',
                select: 'name images',
                match: { isDeleted: false, status: 'active' },
            });

            selectedCartItems = items.map((item) => {
                const variation = populatedItems.find(
                    (v) => v._id.toString() === item.variationId
                );
                if (!variation || !variation.productId) {
                    throw new Error(`Biến thể sản phẩm ${item.variationId} không hợp lệ hoặc sản phẩm không còn bán`);
                }
                return {
                    variationId: {
                        _id: variation._id,
                        finalPrice: variation.finalPrice,
                        salePrice: variation.salePrice || variation.finalPrice,
                        stockQuantity: variation.stockQuantity,
                        productId: variation.productId,
                        colorName: variation.colorName || 'Không xác định',
                        material: variation.material || { name: 'Không xác định' },
                        colorImageUrl: variation.colorImageUrl || '',
                    },
                    quantity: item.quantity,
                    salePrice: item.salePrice || variation.salePrice || variation.finalPrice,
                };
            });
        }

        // Kiểm tra tồn kho
        for (const item of selectedCartItems) {
            if (!item.variationId || !item.variationId.productId) {
                return res.status(400).json({
                    success: false,
                    message: `Biến thể sản phẩm không hợp lệ hoặc sản phẩm không còn bán`,
                });
            }

            if (item.variationId.stockQuantity < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Sản phẩm ${item.variationId.productId.name} chỉ còn ${item.variationId.stockQuantity} đơn vị`,
                });
            }
        }

        // Tạo danh sách items cho đơn hàng
        const orderItems = selectedCartItems.map((item) => ({
            variationId: item.variationId._id,
            quantity: item.quantity,
            salePrice: item.salePrice || item.variationId.salePrice || item.variationId.finalPrice,
        }));

        let totalAmount = orderItems.reduce((total, item) => total + item.salePrice * item.quantity, 0);

        // Áp dụng mã giảm giá nếu có
        let promotionInfo;
        if (couponCode) {
            const promotion = await Promotion.findOne({ code: couponCode.trim(), isActive: true });
            if (promotion && (!promotion.expiryDate || new Date() <= new Date(promotion.expiryDate))) {
                let discountAmount = 0;
                if (promotion.discountType === 'percentage') {
                    discountAmount = (totalAmount * promotion.discountValue) / 100;
                } else {
                    discountAmount = promotion.discountValue;
                }
                totalAmount = Math.max(totalAmount - discountAmount, 0);
                promotionInfo = {
                    code: promotion.code,
                    discountType: promotion.discountType,
                    discountValue: promotion.discountValue,
                };
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn',
                });
            }
        }

        // Cộng phí vận chuyển vào tổng tiền
        totalAmount += Number(shippingFee) || 0;

        // Sử dụng finalAmount từ frontend nếu có
        if (finalAmount && Number(finalAmount) > 0) {
            totalAmount = Number(finalAmount);
        }

        // Tạo đơn hàng
        const newOrder = new Order({
            userId: req.user?.userId || null,
            cartId: cartId || null,
            orderCode: generateOrderCode(),
            customerName: fullName,
            phone,
            email,
            totalAmount,
            shippingFee: Number(shippingFee) || 0,
            shippingAddress,
            paymentMethod,
            items: orderItems,
            status: 'pending',
            promotion: promotionInfo,
            statusHistory: [
                {
                    status: 'pending',
                    note: cartId ? 'Đơn hàng được tạo từ giỏ hàng' : 'Đơn hàng được tạo trực tiếp',
                },
            ],
        });

        // Giảm tồn kho
        for (const item of orderItems) {
            await ProductVariation.findByIdAndUpdate(item.variationId, {
                $inc: { stockQuantity: -item.quantity },
            });
        }

        // Lưu đơn hàng
        const savedOrder = await newOrder.save();

        await Notification.create({
            userId: newOrder.userId,
            message: `🛒 Tạo đơn hàng thành công - Mã đơn hàng: ${newOrder.orderCode}`,
            link: `/order-history`,
            isRead: false
        });

        const io = req.app.get('io'); // ✅ Lấy io từ app
        const user = req.user;
        // ✅ Emit nếu io tồn tại
        if (io) {
            io.emit('new-order', {
                message: `Đơn hàng mới từ ${user.name}`,
                orderId: newOrder._id,
                userId: user._id, // bạn có thể dùng để lọc socket cụ thể
                isRead: false,
                createdAt: new Date(),
            });
        }
        // Gửi email xác nhận
        if (paymentMethod !== 'online_payment') {
            sendOrderStatusUpdateEmail(savedOrder._id, 'pending', 'Đơn hàng đã được tạo thành công')
                .catch((emailError) => {
                    console.error('Lỗi gửi email xác nhận đơn hàng:', emailError);
                });
        }

        // Nếu có cartId, cập nhật giỏ hàng
        if (cartId) {
            const cart = await Cart.findById(cartId);
            if (cart) {
                cart.items = cart.items.filter((item) => !selectedItems.includes(item.variationId._id.toString()));
                if (cart.items.length === 0) {
                    await Cart.findByIdAndDelete(cartId);
                } else {
                    await cart.save();
                }
            }
        }

        // Gửi phản hồi
        return res.status(201).json({
            success: true,
            message: 'Tạo đơn hàng thành công',
            order: savedOrder,
            orderCode: savedOrder.orderCode,
        });
    } catch (err) {
        console.error('Lỗi createOrder:', err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: err.message,
        });
    }
};


// Lấy chi tiết đơn hàng
exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'ID đơn hàng không hợp lệ' });
        }

        const order = await Order.findById(id)
            .populate({
                path: 'userId',
                select: 'name email',
            })
            .populate({
                path: 'items.variationId',
                select: 'name sku dimensions finalPrice salePrice stockQuantity colorName colorHexCode colorImageUrl materialVariation',
                populate: {
                    path: 'productId',
                    select: 'name brand descriptionShort image',
                    match: { isDeleted: false, status: 'active' },
                },
            });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
        }

        const mappedItems = order.items
            .map((item) => {
                if (!item.variationId || !item.variationId.productId) return null;
                return {
                    variationId: item.variationId._id,
                    quantity: item.quantity,
                    salePrice: item.salePrice,
                    name: item.variationId.productId.name,
                    image: item.variationId.productId.image,
                    subtotal: item.salePrice * item.quantity,
                    colorName: item.variationId.colorName,
                    colorImageUrl: item.variationId.colorImageUrl,
                };
            })
            .filter(Boolean);

        res.status(200).json({
            success: true,
            message: 'Lấy chi tiết đơn hàng thành công',
            data: {
                ...order.toObject(),
                items: mappedItems,
            },
        });
    } catch (err) {
        console.error('Lỗi lấy chi tiết đơn hàng:', err);
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};



exports.updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, note } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'ID đơn hàng không hợp lệ' });
        }

        const order = await Order.findById(id).populate('userId');
        if (!order) {
            return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
        }

        // Kiểm tra nếu yêu cầu hủy nhưng trạng thái không cho phép
        if (status === 'canceled') {
            if (order.status !== 'pending') {
                return res.status(400).json({
                    success: false,
                    message: `Không thể hủy đơn hàng ở trạng thái "${order.status}".`
                });
            }
        }

        // Kiểm tra nếu trạng thái không đổi hoặc không hợp lệ
        if (!status || order.status === status) {
            return res.status(400).json({
                success: false,
                message: 'Trạng thái đơn hàng không thay đổi hoặc không hợp lệ'
            });
        }

        // Hoàn tồn kho nếu hủy
        if (status === 'canceled' && order.status !== 'completed') {
            for (const item of order.items) {
                await ProductVariation.findByIdAndUpdate(item.variationId, {
                    $inc: { stockQuantity: item.quantity }
                });
            }
        }

        // Tăng lượt mua nếu hoàn tất
        if (status === 'completed' && order.status !== 'completed') {
            for (const item of order.items) {
                const variation = await ProductVariation.findById(item.variationId);
                if (variation) {
                    await Product.findByIdAndUpdate(variation.productId, {
                        $inc: { totalPurchased: item.quantity }
                    });
                }
            }
        }

        // Cập nhật trạng thái và ghi log
        const updateData = {
            status,
            ...(status === 'canceled' && note ? { cancellationReason: note } : {})
        };

        await Order.findByIdAndUpdate(id, {
            $set: updateData,
            $push: {
                statusHistory: {
                    status,
                    changedAt: new Date(),
                    note: note || `Cập nhật trạng thái thành ${status}`
                }
            }
        });

        // Gửi email thông báo cập nhật trạng thái bất đồng bộ
        sendOrderStatusUpdateEmail(id, status, note)
            .catch((emailError) => {
                console.error('Lỗi gửi email thông báo trạng thái:', emailError);
            });

        return res.status(200).json({
            success: true,
            message: 'Cập nhật đơn hàng thành công',
        });

    } catch (err) {
        console.error('Lỗi updateOrder:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};


// Xóa đơn hàng
exports.deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const userRole = req.user.role;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'ID đơn hàng không hợp lệ' });
        }

        const isAdmin = userRole === 'admin';
        if (!isAdmin) {
            return res.status(403).json({ success: false, message: 'Chỉ admin được xóa đơn hàng' });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
        }

        if (order.status === 'completed') {
            return res.status(400).json({ success: false, message: 'Không thể xóa đơn hàng đã hoàn thành' });
        }

        await Order.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Xóa đơn hàng thành công'
        });
    } catch (err) {
        console.error('Lỗi deleteOrder:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};


// Lấy danh sách đơn hàng theo người dùng
exports.getOrdersByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const userIdFromToken = req.user.userId;
        const { page = 1, limit = 10 } = req.query;

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ success: false, message: 'ID người dùng không hợp lệ' });
        }

        // Kiểm tra quyền truy cập
        if (userId !== userIdFromToken) {
            return res.status(403).json({ success: false, message: 'Không có quyền truy cập đơn hàng của người dùng khác' });
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [orders, total] = await Promise.all([
            Order.find({ userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate({
                    path: 'userId',
                    select: 'name email'
                })
                .populate({
                    path: 'items.variationId',
                    select: 'name sku dimensions finalPrice salePrice stockQuantity colorName colorHexCode colorImageUrl materialVariation',
                    populate: {
                        path: 'productId',
                        select: 'name brand descriptionShort image',
                        match: { isDeleted: false, status: 'active' }
                    }
                }),
            Order.countDocuments({ userId })
        ]);

        // Nhóm items theo productId
        const groupedOrders = orders.map(order => {
            const groupedItems = order.items.reduce((acc, item) => {
                if (!item.variationId || !item.variationId.productId) {
                    return acc;
                }
                const productId = item.variationId.productId._id.toString();
                let group = acc.find(g => g.productId === productId);
                if (!group) {
                    group = {
                        productId,
                        name: item.variationId.productId.name,
                        brand: item.variationId.productId.brand,
                        descriptionShort: item.variationId.productId.descriptionShort,
                        image: item.variationId.productId.image,
                        variations: [],
                        totalQuantity: 0,
                        totalPrice: 0
                    };
                    acc.push(group);
                }
                group.variations.push({
                    variationId: item.variationId._id,
                    name: item.variationId.name,
                    sku: item.variationId.sku,
                    dimensions: item.variationId.dimensions,
                    finalPrice: item.variationId.finalPrice,
                    salePrice: item.salePrice,
                    stockQuantity: item.variationId.stockQuantity,
                    colorName: item.variationId.colorName,
                    colorHexCode: item.variationId.colorHexCode,
                    colorImageUrl: item.variationId.colorImageUrl,
                    materialVariation: item.variationId.materialVariation,
                    quantity: item.quantity,
                    subtotal: item.salePrice * item.quantity
                });
                group.totalQuantity += item.quantity;
                group.totalPrice += item.salePrice * item.quantity;
                return acc;
            }, []);

            return {
                ...order.toObject(),
                items: groupedItems
            };
        });

        res.status(200).json({
            success: true,
            message: 'Lấy danh sách đơn hàng của người dùng thành công',
            data: groupedOrders,
            pagination: {
                total,
                page: parseInt(page),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('Lỗi getOrdersByUser:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};


const calculateFinalPrice = async (items, promoCode) => {
    let originalPrice = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );
    let finalPrice = originalPrice;
    let discountAmount = 0;

    if (promoCode) {
        const promo = await Promotion.findOne({ code: promoCode, isActive: true });

        // Áp dụng nếu mã tồn tại, chưa hết hạn và hợp lệ
        if (promo && (!promo.expiryDate || new Date() <= promo.expiryDate)) {
            if (promo.discountType === "percentage") {
                discountAmount = (originalPrice * promo.discountValue) / 100;
            } else {
                discountAmount = promo.discountValue;
            }

            // Điều kiện áp dụng: đơn hàng > 500k
            if (originalPrice >= 500000) {
                finalPrice = Math.max(originalPrice - discountAmount, 0);
            }
        }
    }

    return { originalPrice, finalPrice, discountAmount };
};


exports.getOrderStatus = async (req, res) => {
    try {
        const { orderCode } = req.query;

        if (!orderCode) {
            return res.status(400).json({ message: "Missing orderCode" });
        }

        // Tìm theo trường orderCode của bạn
        const order = await Order.findOne({ orderCode: orderCode.trim() });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.json({
            paymentStatus: order.paymentStatus,
            orderStatus: order.status
        });

    } catch (error) {
        console.error("Error fetching order status:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
}
