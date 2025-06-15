// src/controllers/order.controller.js
const mongoose = require('mongoose');

const Promotion = require("../models/promotion.model");
// Lấy danh sách đơn hàng (loc, phan trang)

const Order = require('../models/order.model');
const Cart = require('../models/cart.model');
const ProductVariation = require('../models/product_variations.model');
const Product = require('../models/products.model');
const User = require('../models/user.model');

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
            const { userId, customerName, shippingAddress, paymentMethod, phone, email } = req.body;
    
            console.log('req.user:', req.user); // Debug
    
            if (!req.user || !req.user.userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Không tìm thấy thông tin người dùng. Vui lòng cung cấp token xác thực hợp lệ.'
                });
            }
    
        const userIdFromToken = req.user.userId;
    
        // Kiểm tra userId hợp lệ và khớp với token
        if (!mongoose.isValidObjectId(userId) || userId !== userIdFromToken) {
            return res.status(400).json({
            success: false,
            message: 'ID người dùng không hợp lệ hoặc không được phép'
            });
        }
    
        // Lấy thông tin người dùng
        const user = await User.findById(userId).select('name email phone address');
        if (!user) {
            return res.status(404).json({
            success: false,
            message: 'Người dùng không tồn tại'
            });
        }
    
        // Sử dụng thông tin từ User nếu không được cung cấp
        const finalCustomerName = customerName || user.name;
        const finalPhone = phone || user.phone;
        const finalEmail = email || user.email;
    
        if (!finalCustomerName || !shippingAddress || !paymentMethod || !finalPhone || !finalEmail) {
            return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin bắt buộc'
            });
        }
    
        if (!['cod', 'bank_transfer', 'online_payment'].includes(paymentMethod)) {
            return res.status(400).json({
            success: false,
            message: 'Phương thức thanh toán không hợp lệ'
            });
        }
    
        // Kiểm tra shippingAddress
        if (!shippingAddress.street || !shippingAddress.city) {
            return res.status(400).json({
            success: false,
            message: 'Địa chỉ giao hàng thiếu thông tin street hoặc city'
            });
        }
    
        // Lấy giỏ hàng
        const cart = await Cart.findOne({ userId }).populate({
            path: 'items.variationId',
            select: 'finalPrice salePrice stockQuantity',
            populate: {
            path: 'productId',
            select: 'name',
            match: { isDeleted: false, status: 'active' }
            }
        });
    
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
            success: false,
            message: 'Giỏ hàng trống hoặc không tồn tại'
            });
        }
    
        // Kiểm tra tồn kho
        for (const item of cart.items) {
            if (!item.variationId || !item.variationId.productId) {
            return res.status(400).json({
                success: false,
                message: `Biến thể sản phẩm ${item.variationId} không hợp lệ`
            });
            }
            if (item.variationId.stockQuantity < item.quantity) {
            return res.status(400).json({
                success: false,
                message: `Sản phẩm ${item.variationId.productId.name} chỉ còn ${item.variationId.stockQuantity} đơn vị`
            });
            }
        }
    
        // Tạo danh sách items cho đơn hàng
        const items = cart.items.map(item => ({
            variationId: item.variationId._id,
            quantity: item.quantity,
            salePrice: item.variationId.salePrice || item.variationId.finalPrice
        }));
    
        // Tính tổng giá trị
        const totalAmount = items.reduce((total, item) => total + item.salePrice * item.quantity, 0);
    
        // Tạo đơn hàng
        const newOrder = new Order({
            userId,
            orderCode: generateOrderCode(),
            customerName: finalCustomerName,
            phone: finalPhone,
            email: finalEmail,
            totalAmount,
            shippingAddress,
            paymentMethod,
            items,
            status: 'pending',
            statusHistory: [
            {
                status: 'pending',
                changedAt: new Date(),
                note: 'Đơn hàng được tạo từ giỏ hàng'
            }
            ]
        });
    
        // Cập nhật tồn kho
        for (const item of items) {
            await ProductVariation.findByIdAndUpdate(item.variationId, {
            $inc: { stockQuantity: -item.quantity }
            });
        }
    
        // Lưu đơn hàng
        const savedOrder = await newOrder.save();
    
        // Xóa giỏ hàng
        await Cart.deleteOne({ userId });
    
        res.status(201).json({
            success: true,
            message: 'Tạo đơn hàng thành công',
            order: savedOrder
        });
        } catch (err) {
        console.error('Lỗi createOrder:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: err.message
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

        if (!order) {
            return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
        }

        // Nhóm items theo productId
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

        res.status(200).json({
            success: true,
            message: 'Lấy chi tiết đơn hàng thành công',
            data: {
                ...order.toObject(),
                items: groupedItems
            }
        });
    } catch (err) {
        console.error('Lỗi lấy chi tiết đơn hàng:', err);
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

// Cập nhật đơn hàng
exports.updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, note } = req.body;
        const userIdFromToken = req.user.userId;
        const userRole = req.user.roleId; // Giả sử roleId được lưu trong token

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'ID đơn hàng không hợp lệ' });
        }

        const order = await Order.findById(id).populate('userId');
        if (!order) {
            return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
        }

        // Kiểm tra quyền: chỉ admin hoặc chủ đơn hàng được cập nhật
        const isAdmin = userRole.toString() === 'admin_role_id'; // Thay 'admin_role_id' bằng ID thực tế
        if (!isAdmin && order.userId._id.toString() !== userIdFromToken) {
            return res.status(403).json({ success: false, message: 'Không có quyền cập nhật đơn hàng' });
        }

        if (status && order.status !== status) {
            // Xử lý khi hủy đơn hàng
            if (status === 'canceled' && order.status !== 'completed') {
                for (const item of order.items) {
                    await ProductVariation.findByIdAndUpdate(item.variationId, {
                        $inc: { stockQuantity: item.quantity }
                    });
                }
            }

            // Cập nhật totalPurchased khi hoàn thành
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

            order.status = status;
            order.statusHistory.push({
                status,
                changedAt: new Date(),
                note: note || `Cập nhật trạng thái thành ${status}`
            });
        }

        await order.save();

        res.status(200).json({
            success: true,
            message: 'Cập nhật đơn hàng thành công',
            order
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
        const userRole = req.user.roleId;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'ID đơn hàng không hợp lệ' });
        }

        // Chỉ admin được xóa
        const isAdmin = userRole.toString() === 'admin_role_id'; // Thay 'admin_role_id' bằng ID thực tế
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

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ success: false, message: 'ID người dùng không hợp lệ' });
        }

        // Kiểm tra quyền
        if (userId !== userIdFromToken) {
            return res.status(403).json({ success: false, message: 'Không có quyền truy cập đơn hàng của người dùng khác' });
        }

        const orders = await Order.find({ userId })
            .sort({ createdAt: -1 })
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
            data: groupedOrders
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

