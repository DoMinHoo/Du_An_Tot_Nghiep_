const mongoose = require('mongoose');
const Cart = require('../models/cart.model');
const ProductVariation = require('../models/product_variations.model');
const Product = require('../models/products.model');

// 1. Thêm sản phẩm vào giỏ hàng
exports.addToCart = async (req, res) => {
    try {
        const { variationId, quantity = 1 } = req.body;
        const userId = req.user?.userId;
        const guestId = req.guest?.guestId;

        // Kiểm tra variationId hợp lệ
        if (!mongoose.isValidObjectId(variationId)) {
            return res.status(400).json({
                success: false,
                message: 'ID biến thể sản phẩm không hợp lệ',
            });
        }

        // Validate quantity
        if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Số lượng phải là số nguyên lớn hơn 0',
            });
        }

        // Kiểm tra biến thể sản phẩm
        const variation = await ProductVariation.findById(variationId).populate({
            path: 'productId',
            match: { isDeleted: false, status: 'active' }
        });
        if (!variation || !variation.productId) {
            return res.status(404).json({
                success: false,
                message: 'Biến thể sản phẩm không tồn tại hoặc sản phẩm đã bị xóa',
            });
        }

        // Kiểm tra tồn kho
        if (variation.stockQuantity < quantity) {
            return res.status(400).json({
                success: false,
                message: `Biến thể sản phẩm chỉ còn ${variation.stockQuantity} đơn vị`,
            });
        }

        // Tìm hoặc tạo giỏ hàng
        let cart;
        if (userId) {
            cart = await Cart.findOne({ userId });
        } else {
            cart = await Cart.findOne({ guestId });
        }

        if (!cart) {
            cart = new Cart({
                userId: userId || null,
                guestId: guestId || null,
                items: [{ variationId, quantity }],
            });
        } else {
            const itemIndex = cart.items.findIndex(
                (item) => item.variationId.toString() === variationId
            );

            if (itemIndex > -1) {
                const newQuantity = cart.items[itemIndex].quantity + quantity;
                if (variation.stockQuantity < newQuantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Số lượng yêu cầu vượt quá tồn kho (${variation.stockQuantity})`,
                    });
                }
                cart.items[itemIndex].quantity = newQuantity;
            } else {
                cart.items.push({ variationId, quantity });
            }
        }

        await cart.save();
        res.status(200).json({
            success: true,
            message: 'Thêm biến thể sản phẩm vào giỏ hàng thành công',
            data: { cart, guestId: guestId || null },
        });
    } catch (error) {
        console.error('Lỗi addToCart:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server: ' + error.message,
        });
    }
};

// 2. Cập nhật số lượng sản phẩm trong giỏ
exports.updateCartItem = async (req, res) => {
    try {
        const { variationId, quantity } = req.body;
        const userId = req.user?.userId;
        const guestId = req.guest?.guestId;

        // Kiểm tra variationId hợp lệ
        if (!mongoose.isValidObjectId(variationId)) {
            return res.status(400).json({
                success: false,
                message: 'ID biến thể sản phẩm không hợp lệ',
            });
        }

        // Validate quantity
        if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Số lượng phải là số nguyên lớn hơn 0',
            });
        }

        // Kiểm tra biến thể sản phẩm
        const variation = await ProductVariation.findById(variationId).populate({
            path: 'productId',
            match: { isDeleted: false, status: 'active' }
        });
        if (!variation || !variation.productId) {
            return res.status(404).json({
                success: false,
                message: 'Biến thể sản phẩm không tồn tại hoặc sản phẩm đã bị xóa',
            });
        }

        // Kiểm tra tồn kho
        if (variation.stockQuantity < quantity) {
            return res.status(400).json({
                success: false,
                message: `Biến thể sản phẩm chỉ còn ${variation.stockQuantity} đơn vị`,
            });
        }

        // Tìm giỏ hàng
        let cart;
        if (userId) {
            cart = await Cart.findOne({ userId });
        } else {
            cart = await Cart.findOne({ guestId });
        }

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Giỏ hàng không tồn tại',
            });
        }

        // Tìm và cập nhật sản phẩm
        const itemIndex = cart.items.findIndex(
            (item) => item.variationId.toString() === variationId
        );
        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Biến thể sản phẩm không có trong giỏ hàng',
            });
        }

        cart.items[itemIndex].quantity = quantity;
        await cart.save();

        res.status(200).json({
            success: true,
            message: 'Cập nhật số lượng thành công',
            data: { cart, guestId: guestId || null },
        });
    } catch (error) {
        console.error('Lỗi updateCartItem:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server: ' + error.message,
        });
    }
};

// 3. Xóa một sản phẩm khỏi giỏ hàng
exports.removeCartItem = async (req, res) => {
    try {
        const { variationId } = req.params;
        const userId = req.user?.userId;
        const guestId = req.guest?.guestId;

        // Kiểm tra variationId hợp lệ
        if (!mongoose.isValidObjectId(variationId)) {
            return res.status(400).json({
                success: false,
                message: 'ID biến thể sản phẩm không hợp lệ',
            });
        }

        // Tìm giỏ hàng
        let cart;
        if (userId) {
            cart = await Cart.findOne({ userId });
        } else {
            cart = await Cart.findOne({ guestId });
        }

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Giỏ hàng không tồn tại',
            });
        }

        // Lọc bỏ sản phẩm
        cart.items = cart.items.filter(
            (item) => item.variationId.toString() !== variationId
        );

        // Xóa giỏ hàng nếu không còn sản phẩm
        if (cart.items.length === 0) {
            await Cart.deleteOne({ userId: userId || null, guestId: guestId || null });
            return res.status(200).json({
                success: true,
                message: 'Xóa biến thể sản phẩm và giỏ hàng thành công',
                data: null,
            });
        }

        await cart.save();
        res.status(200).json({
            success: true,
            message: 'Xóa biến thể sản phẩm khỏi giỏ hàng thành công',
            data: { cart, guestId: guestId || null },
        });
    } catch (error) {
        console.error('Lỗi removeCartItem:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server: ' + error.message,
        });
    }
};

// 4. Xóa toàn bộ giỏ hàng
exports.clearCart = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const guestId = req.guest?.guestId;

        const result = await Cart.deleteOne({ userId: userId || null, guestId: guestId || null });
        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Giỏ hàng không tồn tại',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xóa toàn bộ giỏ hàng thành công',
            data: null,
        });
    } catch (error) {
        console.error('Lỗi clearCart:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server: ' + error.message,
        });
    }
};

// 5. Lấy thông tin giỏ hàng
exports.getCart = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const guestId = req.guest?.guestId;

        // Tìm giỏ hàng
        let cart;
        if (userId) {
            cart = await Cart.findOne({ userId }).populate({
                path: 'items.variationId',
                select: 'name sku dimensions finalPrice salePrice stockQuantity colorName colorHexCode colorImageUrl materialVariation',
                populate: {
                    path: 'productId',
                    match: { isDeleted: false, status: 'active' }
                }
            });
        } else {
            cart = await Cart.findOne({ guestId }).populate({
                path: 'items.variationId',
                select: 'name sku dimensions finalPrice salePrice stockQuantity colorName colorHexCode colorImageUrl materialVariation',
                populate: {
                    path: 'productId',
                    match: { isDeleted: false, status: 'active' }
                }
            });
        }

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Giỏ hàng không tồn tại',
            });
        }

        // Lọc bỏ các item không hợp lệ
        cart.items = cart.items.filter((item) => item.variationId && item.variationId.productId);
        await cart.save();

        // Tính tổng giá trị giỏ hàng
        const totalPrice = cart.items.reduce((total, item) => {
            const price = item.variationId.salePrice || item.variationId.finalPrice;
            return total + price * item.quantity;
        }, 0);

        res.status(200).json({
            success: true,
            message: 'Lấy giỏ hàng thành công',
            data: {
                cart,
                totalPrice,
                guestId: guestId || null
            },
        });
    } catch (error) {
        console.error('Lỗi getCart:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server: ' + error.message,
        });
    }
};

// 6. Hợp nhất giỏ hàng khi đăng nhập
exports.mergeCart = async (req, res) => {
    try {
        const { guestId } = req.body;
        const userId = req.user.userId;

        if (!guestId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp guestId',
            });
        }

        // Tìm giỏ hàng guest
        const guestCart = await Cart.findOne({ guestId });
        if (!guestCart) {
            return res.status(404).json({
                success: false,
                message: 'Giỏ hàng guest không tồn tại',
            });
        }

        // Tìm hoặc tạo giỏ hàng của user
        let userCart = await Cart.findOne({ userId });
        if (!userCart) {
            userCart = new Cart({ userId, items: [] });
        }

        // Hợp nhất items
        for (const guestItem of guestCart.items) {
            const variation = await ProductVariation.findById(guestItem.variationId).populate({
                path: 'productId',
                match: { isDeleted: false, status: 'active' }
            });
            if (!variation || !variation.productId) {
                continue; // Bỏ qua nếu biến thể không hợp lệ
            }

            if (variation.stockQuantity < guestItem.quantity) {
                continue; // Bỏ qua nếu số lượng vượt quá tồn kho
            }

            const itemIndex = userCart.items.findIndex(
                (item) => item.variationId.toString() === guestItem.variationId.toString()
            );
            if (itemIndex > -1) {
                userCart.items[itemIndex].quantity += guestItem.quantity;
                if (userCart.items[itemIndex].quantity > variation.stockQuantity) {
                    userCart.items[itemIndex].quantity = variation.stockQuantity;
                }
            } else {
                userCart.items.push({
                    variationId: guestItem.variationId,
                    quantity: guestItem.quantity,
                });
            }
        }

        await userCart.save();
        await Cart.deleteOne({ guestId }); // Xóa giỏ hàng guest

        res.status(200).json({
            success: true,
            message: 'Hợp nhất giỏ hàng thành công',
            data: userCart,
        });
    } catch (error) {
        console.error('Lỗi mergeCart:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server: ' + error.message,
        });
    }
};