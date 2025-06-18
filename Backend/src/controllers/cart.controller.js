        const mongoose = require('mongoose');
        const Cart = require('../models/cart.model');
        const ProductVariation = require('../models/product_variations.model');
        const Product = require('../models/products.model');
        const { v4: uuidv4 } = require('uuid');

        // 1. Thêm sản phẩm vào giỏ hàng
        exports.addToCart = async (req, res) => {
        try {
            const { variationId, quantity = 1 } = req.body;
            let guestId = req.headers['x-guest-id']?.trim();
            const userId = req.user?.userId;

            if (!variationId || !mongoose.isValidObjectId(variationId)) {
            return res.status(400).json({
                success: false,
                message: 'ID biến thể sản phẩm không hợp lệ hoặc thiếu',
            });
            }

            if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Số lượng phải là số nguyên lớn hơn 0',
            });
            }

            const variation = await ProductVariation.findById(variationId).populate({
            path: 'productId',
            match: { isDeleted: false, status: 'active' },
            });
            if (!variation || !variation.productId) {
            return res.status(404).json({
                success: false,
                message: 'Biến thể sản phẩm không tồn tại hoặc sản phẩm đã bị xóa',
            });
            }

            if (variation.stockQuantity < quantity) {
            return res.status(400).json({
                success: false,
                message: `Biến thể sản phẩm chỉ còn ${variation.stockQuantity} đơn vị`,
            });
            }

            let cart;
            if (userId) {
            cart = await Cart.findOneAndUpdate(
                { userId },
                { $setOnInsert: { userId, guestId: null, items: [] } },
                { upsert: true, new: true }
            );
            } else {
            if (!guestId) {
                guestId = uuidv4();
            }
            cart = await Cart.findOneAndUpdate(
                { guestId },
                { $setOnInsert: { userId: null, guestId, items: [] } },
                { upsert: true, new: true }
            );
            }

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

            await cart.save();
            res.status(200).json({
            success: true,
            message: 'Thêm biến thể sản phẩm vào giỏ hàng thành công',
            data: { cart, guestId: userId ? null : guestId },
            });
        } catch (error) {
            console.error('Lỗi addToCart:', error);
            if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Giỏ hàng đã tồn tại, vui lòng thử lại hoặc cung cấp guestId hợp lệ',
            });
            }
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
            let guestId = req.headers['x-guest-id']?.trim();
            const userId = req.user?.userId;

            if (!variationId || !mongoose.isValidObjectId(variationId)) {
            return res.status(400).json({
                success: false,
                message: 'ID biến thể sản phẩm không hợp lệ hoặc thiếu',
            });
            }

            if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Số lượng phải là số nguyên lớn hơn 0',
            });
            }

            const variation = await ProductVariation.findById(variationId).populate({
            path: 'productId',
            match: { isDeleted: false, status: 'active' },
            });
            if (!variation || !variation.productId) {
            return res.status(404).json({
                success: false,
                message: 'Biến thể sản phẩm không tồn tại hoặc sản phẩm đã bị xóa',
            });
            }

            if (variation.stockQuantity < quantity) {
            return res.status(400).json({
                success: false,
                message: `Biến thể sản phẩm chỉ còn ${variation.stockQuantity} đơn vị`,
            });
            }

            let cart;
            if (userId) {
            cart = await Cart.findOne({ userId });
            } else {
            if (!guestId) {
                return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp guestId',
                });
            }
            cart = await Cart.findOne({ guestId });
            }

            if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Giỏ hàng không tồn tại',
            });
            }

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

            const populatedCart = await Cart.findById(cart._id).populate({
            path: 'items.variationId',
            select:
                'name sku dimensions finalPrice salePrice stockQuantity colorName colorHexCode colorImageUrl materialVariation',
            populate: {
                path: 'productId',
                select: 'name image isDeleted status',
                match: { isDeleted: false, status: 'active' },
            },
            });

            res.status(200).json({
            success: true,
            message: 'Cập nhật số lượng thành công',
            data: { cart: populatedCart, guestId: userId ? null : guestId },
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
            let guestId = req.headers['x-guest-id']?.trim();
            const userId = req.user?.userId;

            if (!variationId || !mongoose.isValidObjectId(variationId)) {
            return res.status(400).json({
                success: false,
                message: 'ID biến thể sản phẩm không hợp lệ hoặc thiếu',
            });
            }

            let cart;
            if (userId) {
            cart = await Cart.findOne({ userId });
            } else {
            if (!guestId) {
                return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp guestId',
                });
            }
            cart = await Cart.findOne({ guestId });
            }

            if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Giỏ hàng không tồn tại',
            });
            }

            const itemIndex = cart.items.findIndex(
            (item) => item.variationId.toString() === variationId
            );
            if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Biến thể sản phẩm không có trong giỏ hàng',
            });
            }

            cart.items.splice(itemIndex, 1);

            if (cart.items.length === 0) {
            await Cart.deleteOne({ _id: cart._id });
            return res.status(200).json({
                success: true,
                message: 'Xóa biến thể sản phẩm và giỏ hàng thành công',
                data: null,
            });
            }

            await cart.save();

            const populatedCart = await Cart.findById(cart._id).populate({
            path: 'items.variationId',
            select:
                'name sku dimensions finalPrice salePrice stockQuantity colorName colorHexCode colorImageUrl materialVariation',
            populate: {
                path: 'productId',
                select: 'name image isDeleted status',
                match: { isDeleted: false, status: 'active' },
            },
            });

            res.status(200).json({
            success: true,
            message: 'Xóa biến thể sản phẩm khỏi giỏ hàng thành công',
            data: { cart: populatedCart, guestId: userId ? null : guestId },
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
            let guestId = req.headers['x-guest-id']?.trim();

            if (!userId && !guestId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp userId hoặc guestId',
            });
            }

            const query = userId ? { userId } : { guestId };
            const result = await Cart.deleteOne(query);

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
        let guestId = req.headers['x-guest-id']?.trim();
    
        if (!userId && !guestId) {
            return res.status(400).json({
            success: false,
            message: 'Vui lòng cung cấp userId hoặc guestId',
            });
        }
    
        let cart;
        const populateOptions = {
            path: 'items.variationId',
            select:
            'name sku dimensions finalPrice salePrice stockQuantity colorName colorHexCode colorImageUrl materialVariation',
            populate: {
            path: 'productId',
            select: 'name image isDeleted status',
            match: { isDeleted: false, status: 'active' },
            },
        };
    
        if (userId) {
            cart = await Cart.findOne({ userId }).populate(populateOptions);
        } else {
            cart = await Cart.findOne({ guestId }).populate(populateOptions);
        }
    
        // Nếu không tìm thấy giỏ hàng, trả về giỏ hàng rỗng
        if (!cart) {
            return res.status(200).json({
            success: true,
            message: 'Giỏ hàng chưa được tạo',
            data: {
                cart: { items: [] },
                totalPrice: 0,
                guestId: userId ? null : guestId || uuidv4(), // Tạo guestId mới nếu cần
            },
            });
        }
    
        // Lọc các sản phẩm hợp lệ
        cart.items = cart.items.filter((item) => item.variationId && item.variationId.productId);
    
        const baseImageUrl = process.env.IMAGE_BASE_URL || 'http://localhost:5000';
        cart.items = cart.items.map((item) => {
            if (item.variationId && item.variationId.colorImageUrl) {
            item.variationId.colorImageUrl = item.variationId.colorImageUrl.startsWith('http')
                ? item.variationId.colorImageUrl
                : `${baseImageUrl}${item.variationId.colorImageUrl}`;
            } else {
            item.variationId.colorImageUrl = `${baseImageUrl}/default-image.jpg`;
            }
            return item;
        });
    
        await cart.save();
    
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
            guestId: userId ? null : guestId,
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

            const guestCart = await Cart.findOne({ guestId });
            if (!guestCart) {
            return res.status(404).json({
                success: false,
                message: 'Giỏ hàng guest không tồn tại',
            });
            }

            let userCart = await Cart.findOne({ userId });
            if (!userCart) {
            userCart = new Cart({ userId, items: [] });
            }

            for (const guestItem of guestCart.items) {
            const variation = await ProductVariation.findById(guestItem.variationId).populate({
                path: 'productId',
                match: { isDeleted: false, status: 'active' },
            });
            if (!variation || !variation.productId) {
                continue;
            }

            if (variation.stockQuantity < guestItem.quantity) {
                continue;
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
            await Cart.deleteOne({ guestId });

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
// 4. Xóa nhiều sản phẩm khỏi giỏ hàng
    exports.deleteMultipleCartItems = async (req, res) => {
        try {
        const { variationIds } = req.body;
        let guestId = req.headers['x-guest-id']?.trim();
        const userId = req.user?.userId;
    
        if (!variationIds || !Array.isArray(variationIds) || variationIds.length === 0) {
            return res.status(400).json({
            success: false,
            message: 'Danh sách variationIds không hợp lệ hoặc thiếu',
            });
        }
    
        // Kiểm tra tính hợp lệ của các variationId
        const invalidIds = variationIds.filter(id => !mongoose.isValidObjectId(id));
        if (invalidIds.length > 0) {
            return res.status(400).json({
            success: false,
            message: 'Một hoặc nhiều variationId không hợp lệ',
            });
        }
    
        let cart;
        if (userId) {
            cart = await Cart.findOne({ userId });
        } else {
            if (!guestId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp guestId',
            });
            }
            cart = await Cart.findOne({ guestId });
        }
    
        if (!cart) {
            return res.status(404).json({
            success: false,
            message: 'Giỏ hàng không tồn tại',
            });
        }
    
        // Lọc các variationId có trong giỏ hàng
        const itemsToRemove = cart.items.filter(item => 
            variationIds.includes(item.variationId.toString())
        );
    
        if (itemsToRemove.length === 0) {
            return res.status(404).json({
            success: false,
            message: 'Không tìm thấy sản phẩm nào trong danh sách để xóa',
            });
        }
    
        // Xóa các sản phẩm khỏi giỏ hàng
        cart.items = cart.items.filter(
            item => !variationIds.includes(item.variationId.toString())
        );
    
        if (cart.items.length === 0) {
            await Cart.deleteOne({ _id: cart._id });
            return res.status(200).json({
            success: true,
            message: 'Xóa các sản phẩm và giỏ hàng thành công',
            data: null,
            });
        }
    
        await cart.save();
    
        const populatedCart = await Cart.findById(cart._id).populate({
            path: 'items.variationId',
            select:
            'name sku dimensions finalPrice salePrice stockQuantity colorName colorHexCode colorImageUrl materialVariation',
            populate: {
            path: 'productId',
            select: 'name image isDeleted status',
            match: { isDeleted: false, status: 'active' },
            },
        });
    
        res.status(200).json({
            success: true,
            message: `Xóa ${itemsToRemove.length} sản phẩm khỏi giỏ hàng thành công`,
            data: { cart: populatedCart, guestId: userId ? null : guestId },
        });
        } catch (error) {
        console.error('Lỗi deleteMultipleCartItems:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server: ' + error.message,
        });
        }
    };
        