        const mongoose = require('mongoose');
        const Cart = require('../models/cart.model');
        const ProductVariation = require('../models/product_variations.model');
        const Product = require('../models/products.model');
const { v4: uuidv4 } = require('uuid');
        const logger = require('../untils/logger');

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

        // Tìm số lượng sản phẩm đã có trong giỏ hàng
        const itemIndex = cart.items.findIndex(
            (item) => item.variationId.toString() === variationId
        );
        // Nếu sản phẩm đã có trong giỏ hàng, lấy số lượng hiện tại
        const currentQuantityInCart = itemIndex > -1 ? cart.items[itemIndex].quantity : 0;

        // Tính số lượng còn lại thực tế
        const remainingQuantity = variation.stockQuantity - currentQuantityInCart;

        // Kiểm tra số lượng yêu cầu so với số lượng còn lại thực tế
        if (remainingQuantity === 0) {
            return res.status(400).json({    success: false,
                message: 'Giỏ hàng của bạn đã thêm hết số lượng sản phẩm',
            });
        }
        else if (remainingQuantity < quantity) {
            return res.status(400).json({
                success: false,
                message: `Chỉ còn ${remainingQuantity} sản phẩm`,
            });
        }

        if (itemIndex > -1) {
            // Cập nhật số lượng nếu sản phẩm đã có trong giỏ hàng
            cart.items[itemIndex].quantity += quantity;
        } else {
            // Thêm sản phẩm mới vào giỏ hàng
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

// Hợp nhất giỏ hàng khi đăng nhập

exports.mergeCart = async (req, res) => {
    try {
        const { guestId } = req.body;
        const userId = req.user.userId;

        // Kiểm tra guestId
        if (!guestId) {
            logger.warn(`Yêu cầu hợp nhất giỏ hàng không có guestId từ userId: ${userId}`);
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp guestId',
            });
        }

        // Tìm giỏ hàng khách
        const guestCart = await Cart.findOne({ guestId });
        const userCart = await Cart.findOne({ userId });

        // Trường hợp 1: Không có giỏ hàng khách hoặc giỏ hàng khách rỗng
        if (!guestCart || !guestCart.items.length) {
            logger.info(`Không tìm thấy giỏ hàng khách với guestId: ${guestId} hoặc giỏ hàng rỗng`);

            // Nếu người dùng cũng không có giỏ hàng, trả về giỏ hàng rỗng
            if (!userCart) {
                return res.status(200).json({
                    success: true,
                    message: 'Không có giỏ hàng khách hoặc người dùng để hợp nhất',
                    data: { cart: { items: [] }, totalPrice: 0 },
                });
            }

            const populatedCart = await Cart.findById(userCart._id).populate({
                path: 'items.variationId',
                select: 'name sku dimensions finalPrice salePrice stockQuantity colorName colorHexCode colorImageUrl materialVariation',
                populate: {
                    path: 'productId',
                    select: 'name image isDeleted status',
                    match: { isDeleted: false, status: 'active' },
                },
            });

            const totalPrice = populatedCart.items.reduce((total, item) => {
                const price = item.variationId.salePrice || item.variationId.finalPrice;
                return total + price * item.quantity;
            }, 0);

            return res.status(200).json({
                success: true,
                message: 'Không có giỏ hàng khách để hợp nhất, trả về giỏ hàng người dùng',
                data: { cart: populatedCart, totalPrice },
            });
        }


        // Trường hợp 2: Người dùng đã có giỏ hàng
        if (userCart && userCart.items.length > 0) {
            logger.info(`Giỏ hàng người dùng với userId: ${userId} đã chứa sản phẩm, xóa guestCart: ${guestId}`);
            await Cart.deleteOne({ guestId });

            const populatedCart = await Cart.findById(userCart._id).populate({
                path: 'items.variationId',
                select: 'name sku dimensions finalPrice salePrice stockQuantity colorName colorHexCode colorImageUrl materialVariation',
                populate: {
                    path: 'productId',
                    select: 'name image isDeleted status',
                    match: { isDeleted: false, status: 'active' },
                },
            });


            const totalPrice = populatedCart.items.reduce((total, item) => {
                const price = item.variationId.salePrice || item.variationId.finalPrice;
                return total + price * item.quantity;
            }, 0);

            return res.status(200).json({
                success: true,
                message: 'Giỏ hàng người dùng đã tồn tại, giỏ hàng khách đã bị xóa',
                data: { cart: populatedCart, totalPrice },
            });
        }

        // Trường hợp 3: Người dùng chưa có giỏ hàng hoặc giỏ hàng rỗng, tiến hành hợp nhất
        let newUserCart = userCart || new Cart({ userId, items: [] });
        logger.info(userCart ? `Tìm thấy giỏ hàng rỗng cho userId: ${userId}` : `Tạo giỏ hàng mới cho userId: ${userId}`);

        // Truy vấn hàng loạt các biến thể sản phẩm từ giỏ hàng khách

        const variationIds = guestCart.items.map((item) => item.variationId);
        const variations = await ProductVariation.find({ _id: { $in: variationIds } }).populate({
            path: 'productId',
            match: { isDeleted: false, status: 'active' },
        });

        const variationMap = new Map(variations.map((v) => [v._id.toString(), v]));

        let mergedItems = 0;

        // Hợp nhất các mặt hàng từ giỏ hàng khách
        for (const guestItem of guestCart.items) {
            const variation = variationMap.get(guestItem.variationId.toString());
            if (!variation || !variation.productId) {
                logger.warn(`Bỏ qua biến thể không hợp lệ: ${guestItem.variationId} cho userId: ${userId}`);
                continue;
            }

            // Kiểm tra số lượng tồn kho
            const maxQuantity = variation.stockQuantity;
            if (maxQuantity < guestItem.quantity) {
                logger.warn(
                    `Bỏ qua biến thể ${guestItem.variationId} do thiếu tồn kho (${maxQuantity}) cho userId: ${userId}`
                );
                continue;
            }

            const itemIndex = newUserCart.items.findIndex(
                (item) => item.variationId.toString() === guestItem.variationId.toString()
            );

            if (itemIndex > -1) {

                // Cập nhật số lượng nếu sản phẩm đã có trong giỏ hàng người dùng
                newUserCart.items[itemIndex].quantity += guestItem.quantity;
                if (newUserCart.items[itemIndex].quantity > maxQuantity) {
                    newUserCart.items[itemIndex].quantity = maxQuantity;
                    logger.info(
                        `Giới hạn số lượng biến thể ${guestItem.variationId} ở mức tồn kho: ${maxQuantity} cho userId: ${userId}`
                    );
                }
            } else {
                // Thêm sản phẩm mới vào giỏ hàng người dùng
                newUserCart.items.push({
                    variationId: guestItem.variationId,
                    quantity: Math.min(guestItem.quantity, maxQuantity),
                });
                mergedItems++;
            }
        }

        // Lưu giỏ hàng người dùng
        await newUserCart.save();

        // Xóa giỏ hàng khách
        await Cart.deleteOne({ guestId });

        // Populate giỏ hàng để trả về
        const populatedCart = await Cart.findById(newUserCart._id).populate({
            path: 'items.variationId',
            select: 'name sku dimensions finalPrice salePrice stockQuantity colorName colorHexCode colorImageUrl materialVariation',
            populate: {
                path: 'productId',
                select: 'name image isDeleted status',
                match: { isDeleted: false, status: 'active' },
            },
        });

        // Tính tổng giá
        const totalPrice = populatedCart.items.reduce((total, item) => {
            const price = item.variationId.salePrice || item.variationId.finalPrice;
            return total + price * item.quantity;
        }, 0);

        logger.info(`Hợp nhất ${mergedItems} mặt hàng thành công từ guestId: ${guestId} sang userId: ${userId}`);

        res.status(200).json({
            success: true,
            message: `Hợp nhất giỏ hàng thành công (${mergedItems} mặt hàng)`,
            data: {
                cart: populatedCart,
                totalPrice,
            },
        });
    } catch (error) {

        logger.error(`Lỗi hợp nhất giỏ hàng cho userId: ${userId}, guestId: ${guestId}`, error);

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
        