const mongoose = require('mongoose');
const Promotion = require("../models/promotion.model");
const Order = require('../models/order.model');
const Cart = require('../models/cart.model');
const ProductVariation = require('../models/product_variations.model');
const Product = require('../models/products.model');
const User = require('../models/user.model');
const { sendPaymentSuccessEmail, sendOrderSuccessEmail, sendOrderStatusUpdateEmail } = require('../untils/sendPaymentSuccessEmail');
const Notification = require('../models/notification');
const generateAppTransId = () => `txn_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

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
                    select: 'name brand descriptionShort image'
                }
            });

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
    const {
      shippingAddress,
      paymentMethod,
      cartId,
      finalAmount,
      couponCode,
      selectedItems,
      shippingFee,
      items,
    } = req.body;

    const {
      fullName,
      phone,
      email,
      addressLine,
      street,
      province,
      district,
      ward,
    } = shippingAddress || {};

    // 1️⃣ Validate thông tin giao hàng
    if (
      !fullName ||
      !phone ||
      !email ||
      !addressLine ||
      !street ||
      !province ||
      !district ||
      !ward
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Địa chỉ giao hàng chưa đầy đủ" });
    }

    // 2️⃣ Validate phương thức thanh toán
    if (!["cod", "bank_transfer", "online_payment"].includes(paymentMethod)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Phương thức thanh toán không hợp lệ",
        });
    }

    // 3️⃣ Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Danh sách sản phẩm không hợp lệ hoặc trống",
        });
    }

    let selectedCartItems = [];

    // 4️⃣ Lấy danh sách sản phẩm từ giỏ hàng hoặc mua trực tiếp (song song hóa)
    const [cart, populatedItems] = await Promise.all([
      cartId ? Cart.findById(cartId).populate({
        path: "items.variationId",
        select: "finalPrice salePrice stockQuantity productId colorName material colorImageUrl",
        populate: {
          path: "productId",
          select: "name images",
          match: { isDeleted: false, status: "active" },
        },
      }) : null,
      !cartId ? ProductVariation.find({
        _id: { $in: items.map((item) => item.variationId) },
      }).populate({
        path: "productId",
        select: "name images",
        match: { isDeleted: false, status: "active" },
      }) : [],
    ]);

    if (cartId) {
      if (!cart || cart.items.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Giỏ hàng trống hoặc không tồn tại" });
      }
      selectedCartItems = cart.items.filter((item) =>
        selectedItems.includes(item.variationId._id.toString())
      );
      if (selectedCartItems.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Không tìm thấy sản phẩm được chọn trong giỏ hàng" });
      }
    } else {
      selectedCartItems = items.map((item) => {
        const variation = populatedItems.find((v) => v._id.toString() === item.variationId);
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
            colorName: variation.colorName || "Không xác định",
            material: variation.material || { name: "Không xác định" },
            colorImageUrl: variation.colorImageUrl || "",
          },
          quantity: item.quantity,
          salePrice: item.salePrice || variation.salePrice || variation.finalPrice,
        };
      });
    }

    // 5️⃣ Kiểm tra tồn kho
    for (const item of selectedCartItems) {
      if (!item.variationId || !item.variationId.productId) {
        return res
          .status(400)
          .json({ success: false, message: "Biến thể sản phẩm không hợp lệ hoặc sản phẩm không còn bán" });
      }
      if (item.variationId.stockQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm ${item.variationId.productId.name} chỉ còn ${item.variationId.stockQuantity} đơn vị`,
        });
      }
    }

    // 6️⃣ Tính tổng tiền
    const orderItems = selectedCartItems.map((item) => ({
      variationId: item.variationId._id,
      quantity: item.quantity,
      salePrice: item.salePrice || item.variationId.salePrice || item.variationId.finalPrice,
    }));

    let totalAmount = orderItems.reduce((total, item) => total + item.salePrice * item.quantity, 0);

    // Áp dụng mã giảm giá
    let promotionInfo = null;
    if (couponCode) {
      const promotion = await Promotion.findOne({ code: couponCode.trim(), isActive: true });
      if (!promotion || (promotion.expiryDate && new Date() > new Date(promotion.expiryDate))) {
        return res
          .status(400)
          .json({ success: false, message: "Mã giảm giá không hợp lệ hoặc đã hết hạn" });
      }
      if (promotion.maxUsage && promotion.usedCount >= promotion.maxUsage) {
        return res
          .status(400)
          .json({ success: false, message: "Mã giảm giá đã đạt giới hạn sử dụng" });
      }

      const discountAmount = promotion.discountType === "percentage"
        ? Math.min((totalAmount * promotion.discountValue) / 100, promotion.maxDiscountPrice || Infinity)
        : Math.min(promotion.discountValue, promotion.maxDiscountPrice || promotion.discountValue);

      totalAmount = Math.max(totalAmount - discountAmount, 0);
      promotionInfo = {
        code: promotion.code,
        discountType: promotion.discountType,
        discountValue: promotion.discountValue,
        maxDiscountPrice: promotion.maxDiscountPrice,
      };

      await Promotion.findOneAndUpdate({ code: couponCode.trim() }, { $inc: { usedCount: 1 } });
    }

    // Cộng phí ship
    totalAmount += Number(shippingFee) || 0;

    if (finalAmount && Number(finalAmount) > 0) {
      totalAmount = Number(finalAmount);
    }

    // 7️⃣ Tạo order
    const user = req.user || null;

    let customerData = {
      name: fullName,
      email: email,
      phone: phone,
    };

    if (user && user.userId) {
      const registeredUser = await User.findById(user.userId).select("name email phone");
      if (registeredUser) {
        customerData = {
          name: registeredUser.name || fullName,
          email: registeredUser.email || email,
          phone: registeredUser.phone || phone,
        };
      }
    }

    const newOrder = new Order({
      userId: user?.userId || null,
      guestId: user?.guestId || null,
      cartId: cartId || null,
      orderCode: generateOrderCode(),
      app_trans_id: generateAppTransId(),
      customerName: customerData.name,
      customerEmail: customerData.email,
      customerPhone: customerData.phone,
      totalAmount,
      shippingFee: Number(shippingFee) || 0,
      shippingAddress,
      paymentMethod,
      items: orderItems,
      status: "pending",
      paymentStatus: "pending",
      promotion: promotionInfo,
      statusHistory: [{ status: "pending", changedAt: new Date(), note: cartId ? "Đơn hàng được tạo từ giỏ hàng" : "Đơn hàng được tạo trực tiếp" }],
    });

    // Giảm tồn kho song song
    const updateStockPromises = orderItems.map((item) =>
      ProductVariation.findByIdAndUpdate(item.variationId, { $inc: { stockQuantity: -item.quantity } })
    );
    await Promise.all(updateStockPromises);

    const savedOrder = await newOrder.save();

    // 8️⃣ Tạo Notification nếu có user
    if (user?.userId) {
      await Notification.create({
        userId: user.userId,
        message: `🛒 Tạo đơn hàng thành công - Mã đơn hàng: ${newOrder.orderCode}`,
        link: `/order-history`,
        isRead: false,
        createdAt: new Date(),
      });
    }

    // 9️⃣ Emit socket cho client và admin
    const io = req.app.get("io");
    const displayName = user?.name || fullName || "Khách hàng";

    if (io) {
      if (user?.userId) {
        io.to(user.userId.toString()).emit(`new-order-${user.userId}`, {
          message: `Đơn hàng mới từ ${displayName}`,
          orderId: savedOrder._id,
          userId: user.userId,
          isRead: false,
          createdAt: new Date(),
        });
      }

      io.emit("admin-new-order", {
        orderId: savedOrder._id,
        orderCode: savedOrder.orderCode,
        status: savedOrder.status,
        paymentStatus: savedOrder.paymentStatus,
        message: `Đơn hàng mới từ ${displayName}`,
        createdAt: new Date(),
      });
    }

    // 🔟 Gửi email xác nhận (defer sau response)
    if (paymentMethod !== "online_payment") {
      sendOrderStatusUpdateEmail(savedOrder._id, "pending", "Đơn hàng đã được tạo thành công")
        .catch((err) => console.error("Lỗi gửi email xác nhận:", err));
    }

    // 1️⃣1️⃣ Cập nhật giỏ hàng
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

    return res.status(201).json({
      success: true,
      message: "Tạo đơn hàng thành công",
      order: savedOrder,
      orderCode: savedOrder.orderCode,
    });
  } catch (err) {
    console.error("Lỗi createOrder:", err);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: err.message });
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
                populate: [
                    {
                        path: 'productId',
                        select: 'name brand descriptionShort image'
                    },
                    {
                        path: 'material',
                        select: 'name',
                    }
                ]
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
                    name: item.variationId.name,
                    sku: item.variationId.sku,
                    dimensions: item.variationId.dimensions,
                    material: item.variationId.material?.name || item.variationId.material || 'Không xác định',
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

// Cập nhật đơn hàng
exports.updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, note, paymentStatus } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'ID đơn hàng không hợp lệ' });
        }

        const order = await Order.findById(id).populate('userId');
        if (!order) {
            return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
        }

        const updateData = {};

        if (status) {
            if (status === 'canceled') {
                if (order.status !== 'completed') {
                    for (const item of order.items) {
                        await ProductVariation.findByIdAndUpdate(item.variationId, {
                            $inc: { stockQuantity: item.quantity },
                        });
                    }
                }

                if (order.paymentMethod === 'online_payment' && order.paymentStatus === 'completed') {
                    updateData.paymentStatus = 'refund_pending';
                }

                if (note) updateData.cancellationReason = note;
            }

            if (status === 'completed' && order.status !== 'completed') {
                for (const item of order.items) {
                    const variation = await ProductVariation.findById(item.variationId);
                    if (variation) {
                        await Product.findByIdAndUpdate(variation.productId, {
                            $inc: { totalPurchased: item.quantity },
                        });
                    }
                }

                if (order.paymentStatus === 'pending') {
                    updateData.paymentStatus = 'completed';
                }
            }

            updateData.status = status;
        }

        if (paymentStatus) {
            updateData.paymentStatus = paymentStatus;
        }

        const updatedOrder = await Order.findByIdAndUpdate(id, {
            $set: updateData,
            ...(status && {
                $push: {
                    statusHistory: {
                        status,
                        changedAt: new Date(),
                        note: note || `Cập nhật trạng thái thành ${status}`,
                    },
                },
            }),
        }, { new: true });

        if (status) {
            sendOrderStatusUpdateEmail(id, status, note).catch((err) => {
                console.error('Lỗi gửi email cập nhật trạng thái:', err);
            });
        }

        // Emit sự kiện cập nhật trạng thái đến client
        const io = req.app.get('io');
        if (io) {
            io.to(updatedOrder.userId?.toString()).emit('order-updated', {
                orderId: id,
                status: updatedOrder.status,
                paymentStatus: updatedOrder.paymentStatus,
                orderCode: updatedOrder.orderCode,
            });
            io.emit('admin-order-updated', {
                orderId: id,
                status: updatedOrder.status,
                paymentStatus: updatedOrder.paymentStatus,
                orderCode: updatedOrder.orderCode,
            });
        }

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
                    select: 'name sku dimensions finalPrice salePrice stockQuantity colorName colorHexCode colorImageUrl material',
                    populate: {
                        path: 'productId',
                        select: 'name brand descriptionShort image'
                    }
                }),
            Order.countDocuments({ userId })
        ]);

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
                    material: item.variationId.material,
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

        if (promo && (!promo.expiryDate || new Date() <= promo.expiryDate)) {
            if (promo.discountType === "percentage") {
                discountAmount = (originalPrice * promo.discountValue) / 100;
            } else {
                discountAmount = promo.discountValue;
            }

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
};