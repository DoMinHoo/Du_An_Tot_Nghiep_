    const mongoose = require('mongoose');
    const Cart = require('../models/cart.model');
    const ProductVariation = require('../models/product_variations.model');
    const { v4: uuidv4 } = require('uuid');
    const logger = require('../untils/logger');

        exports.addToCart = async (req, res) => {
            try {
            const { variationId, quantity = 1 } = req.body;
            let guestId = req.headers['x-guest-id']?.trim();
            const userId = req.user?.userId;
        
            // Kiểm tra variationId
            if (!variationId || !mongoose.isValidObjectId(variationId)) {
                return res.status(400).json({
                success: false,
                message: 'ID biến thể sản phẩm không hợp lệ hoặc thiếu',
                });
            }
        
            // Kiểm tra quantity
            if (!Number.isInteger(quantity) || quantity < 1) {
                return res.status(400).json({
                success: false,
                message: 'Số lượng phải là số nguyên lớn hơn 0',
                });
            }
        
            // Kiểm tra biến thể sản phẩm
            const variation = await ProductVariation
                .findById(variationId)
                .populate({
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
                // Sử dụng object làm filter cho người dùng đã đăng nhập
                cart = await Cart.findOneAndUpdate(
                { userId }, // Sửa lỗi: truyền object thay vì chuỗi
                { $setOnInsert: { userId, guestId: null, items: [] } },
                { upsert: true, new: true }
                );
            } else {
                // Nếu không có userId, kiểm tra hoặc tạo guestId
                if (!guestId) {
                guestId = uuidv4();
                }
                cart = await Cart.findOneAndUpdate(
                { guestId, userId: null },
                { $setOnInsert: { userId: null, guestId, items: [] } },
                { upsert: true, new: true }
                );
            }
        
            // Kiểm tra số lượng tồn kho
            const itemIndex = cart.items.findIndex(
                (item) => item.variationId.toString() === variationId
            );
            const currentQuantityInCart = itemIndex >= 0 ? cart.items[itemIndex].quantity : 0;
            const remainingQuantity = variation.stockQuantity - currentQuantityInCart;
        
            if (remainingQuantity === 0) {
                return res.status(400).json({
                success: false,
                message: 'Giỏ hàng của bạn đã thêm hết số lượng sản phẩm này',
                });
            } else if (remainingQuantity < quantity) {
                return res.status(400).json({
                success: false,
                message: `Chỉ còn lại ${remainingQuantity} sản phẩm`,
                });
            }
        
            // Cập nhật hoặc thêm sản phẩm vào giỏ hàng
            if (itemIndex >= 0) {
                cart.items[itemIndex].quantity += quantity;
            } else {
                cart.items.push({ variationId, quantity });
            }
        
            await cart.save();
        
            // Populate giỏ hàng để trả về thông tin chi tiết
            const populatedCart = await Cart.findById(cart._id).populate({
                path: 'items.variationId',
                select: 'name sku dimensions finalPrice salePrice stockQuantity colorName colorHexCode colorImageUrl materialVariation',
                populate: {
                path: 'productId',
                select: 'name image isDeleted status',
                match: { isDeleted: false, status: 'active' },
                },
            });
        
            res.status(200).json({
                success: true,
                message: 'Thêm sản phẩm vào giỏ hàng thành công',
                data: { cart: populatedCart, guestId: userId ? null : guestId },
            });
            } catch (error) {
            logger.error('Lỗi addToCart:', error.message);
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
        if (cart && cart.userId.toString() !== userId) {
            logger.warn(`Truy cập trái phép vào giỏ hàng của userId khác: ${userId}`);
            return res.status(403).json({
            success: false,
            message: 'Không có quyền truy cập giỏ hàng này',
            });
        }
        } else {
        if (!guestId) {
            return res.status(400).json({
            success: false,
            message: 'Vui lòng cung cấp guestId',
            });
        }
        cart = await Cart.findOne({ guestId, userId: null });
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
        select: 'name sku dimensions finalPrice salePrice stockQuantity colorName colorHexCode colorImageUrl materialVariation',
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
        logger.error('Lỗi updateCartItem:', error.message);
        res.status(500).json({
        success: false,
        message: 'Lỗi server: ' + error.message,
        });
    }
    };

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
        if (cart && cart.userId.toString() !== userId) {
            logger.warn(`Truy cập trái phép vào giỏ hàng của userId khác: ${userId}`);
            return res.status(403).json({
            success: false,
            message: 'Không có quyền truy cập giỏ hàng này',
            });
        }
        } else {
        if (!guestId) {
            return res.status(400).json({
            success: false,
            message: 'Vui lòng cung cấp guestId',
            });
        }
        cart = await Cart.findOne({ guestId, userId: null });
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
        select: 'name sku dimensions finalPrice salePrice stockQuantity colorName colorHexCode colorImageUrl materialVariation',
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
        logger.error('Lỗi removeCartItem:', error.message);
        res.status(500).json({
        success: false,
        message: 'Lỗi server: ' + error.message,
        });
    }
    };

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

        const invalidIds = variationIds.filter((id) => !mongoose.isValidObjectId(id));
        if (invalidIds.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Một hoặc nhiều variationId không hợp lệ',
        });
        }

        let cart;
        if (userId) {
        cart = await Cart.findOne({ userId });
        if (cart && cart.userId.toString() !== userId) {
            logger.warn(`Truy cập trái phép vào giỏ hàng của userId khác: ${userId}`);
            return res.status(403).json({
            success: false,
            message: 'Không có quyền truy cập giỏ hàng này',
            });
        }
        } else {
        if (!guestId) {
            return res.status(400).json({
            success: false,
            message: 'Vui lòng cung cấp guestId',
            });
        }
        cart = await Cart.findOne({ guestId, userId: null });
        }

        if (!cart) {
        return res.status(404).json({
            success: false,
            message: 'Giỏ hàng không tồn tại',
        });
        }

        const itemsToRemove = cart.items.filter((item) =>
        variationIds.includes(item.variationId.toString())
        );

        if (itemsToRemove.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Không tìm thấy sản phẩm nào trong danh sách để xóa',
        });
        }

        cart.items = cart.items.filter(
        (item) => !variationIds.includes(item.variationId.toString())
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
        select: 'name sku dimensions finalPrice salePrice stockQuantity colorName colorHexCode colorImageUrl materialVariation',
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
        logger.error('Lỗi deleteMultipleCartItems:', error.message);
        res.status(500).json({
        success: false,
        message: 'Lỗi server: ' + error.message,
        });
    }
    };

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

        const query = userId ? { userId } : { guestId, userId: null };
        const cart = await Cart.findOne(query);
        if (cart && userId && cart.userId.toString() !== userId) {
        logger.warn(`Truy cập trái phép vào giỏ hàng của userId khác: ${userId}`);
        return res.status(403).json({
            success: false,
            message: 'Không có quyền truy cập giỏ hàng này',
        });
        }

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
        logger.error('Lỗi clearCart:', error.message);
        res.status(500).json({
        success: false,
        message: 'Lỗi server: ' + error.message,
        });
    }
    };

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
            select: 'name sku dimensions finalPrice salePrice stockQuantity colorName colorHexCode colorImageUrl material',
            populate: [
                {
                    path: 'productId',
                    select: 'name image isDeleted status',
                    match: { isDeleted: false, status: 'active' },
                },
                {
                    path: 'material',
                    select: 'name',
                }
            ],
        };

        if (userId) {
            cart = await Cart.findOne({ userId }).populate(populateOptions);
            if (cart && cart.userId.toString() !== userId) {
                logger.warn(`Truy cập trái phép vào giỏ hàng của userId khác: ${userId}`);
                return res.status(403).json({
                    success: false,
                    message: 'Không có quyền truy cập giỏ hàng này',
                });
            }
        } else {
            cart = await Cart.findOne({ guestId, userId: null }).populate(populateOptions);
        }

        if (!cart) {
            return res.status(200).json({
                success: true,
                message: 'Giỏ hàng chưa được tạo',
                data: {
                    cart: { items: [] },
                    totalPrice: 0,
                    guestId: userId ? null : guestId || uuidv4(),
                },
            });
        }

        cart.items = cart.items.filter((item) => item.variationId && item.variationId.productId);

        const baseImageUrl = process.env.IMAGE_BASE_URL || 'http://localhost:5000';
        cart.items = cart.items.map((item) => {
            if (item.variationId) {
                // Handle colorImageUrl
                item.variationId.colorImageUrl = item.variationId.colorImageUrl
                    ? item.variationId.colorImageUrl.startsWith('http')
                        ? item.variationId.colorImageUrl
                        : `${baseImageUrl}${item.variationId.colorImageUrl}`
                    : `${baseImageUrl}/default-image.jpg`;

                // Handle material display
                if (item.variationId.material) {
                    item.variationId.material = typeof item.variationId.material === 'object'
                        ? item.variationId.material.name
                        : item.variationId.material;
                } else {
                    item.variationId.material = 'Không xác định';
                }
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
        logger.error('Lỗi getCart:', error.message);
        res.status(500).json({
            success: false,
            message: 'Lỗi server: ' + error.message,
        });
    }
};

        exports.mergeCart = async (req, res) => {
            try {
            const { guestId } = req.body;
            const userId = req.user.userId;
        
            if (!guestId) {
                logger.warn(`Yêu cầu hợp nhất không có guestId từ userId: ${userId}`);
                return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp guestId',
                });
            }
        
            if (!mongoose.isValidObjectId(userId)) {
                logger.error(`ID người dùng không hợp lệ: ${userId}`);
                return res.status(400).json({
                success: false,
                message: 'ID người dùng không hợp lệ',
                });
            }
        
            const guestCart = await Cart.findOne({ guestId, userId: null });
            let userCart = await Cart.findOne({ userId });
        
            if (userCart && userCart.userId.toString() !== userId) {
                logger.error(`Truy cập trái phép vào giỏ hàng của userId khác: ${userId}`);
                return res.status(403).json({
                success: false,
                message: 'Không có quyền truy cập giỏ hàng này',
                });
            }
        
            // Nếu giỏ hàng của người dùng đã có sản phẩm, ưu tiên giữ nguyên và xóa guestCart
            if (userCart && userCart.items.length > 0) {
                logger.info(`Giỏ hàng người dùng với userId: ${userId} đã chứa sản phẩm, xóa guestCart: ${guestId}`);
                await Cart.deleteOne({ guestId, userId: null });
        
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
                message: 'Giỏ hàng người dùng đã tồn tại, giỏ hàng khách đã xóa',
                data: { cart: populatedCart, totalPrice },
                });
            }
        
            // Nếu không có guestCart hoặc guestCart rỗng, trả về giỏ hàng hiện tại
            if (!guestCart || !guestCart.items.length) {
                logger.info(`Không tìm thấy guestCart với guestId: ${guestId} hoặc giỏ hàng rỗng`);
        
                if (!userCart) {
                return res.status(200).json({
                    success: true,
                    message: 'Không có giỏ hàng để hợp nhất',
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
                message: 'Không có giỏ hàng khách để hợp nhất',
                data: { cart: populatedCart, totalPrice },
                });
            }
        
            // Hợp nhất giỏ hàng
            let newUserCart = userCart || new Cart({ userId, items: [] });
            const variationIds = guestCart.items.map((item) => item.variationId);
            const variations = await ProductVariation.find({ _id: { $in: variationIds } }).populate({
                path: 'productId',
                match: { isDeleted: false, status: 'active' }, // Sửa status thành 'active'
            });
        
            // Sửa lỗi cú pháp tạo variationMap
            const variationMap = new Map(variations.map((v) => [v._id.toString(), v]));
            let mergedItems = 0;
        
            for (const guestItem of guestCart.items) {
                const variation = variationMap.get(guestItem.variationId.toString());
                if (!variation || !variation.productId) {
                logger.warn(`Bỏ qua biến thể không hợp lệ: ${guestItem.variationId}`);
                continue;
                }
        
                const maxQuantity = variation.stockQuantity;
                if (maxQuantity < guestItem.quantity) {
                logger.warn(`Bỏ qua biến thể do thiếu tồn kho: ${guestItem.variationId}`);
                continue;
                }
        
                const itemIndex = newUserCart.items.findIndex(
                (item) => item.variationId.toString() === guestItem.variationId.toString()
                );
        
                if (itemIndex > -1) {
                newUserCart.items[itemIndex].quantity += guestItem.quantity;
                if (newUserCart.items[itemIndex].quantity > maxQuantity) {
                    newUserCart.items[itemIndex].quantity = maxQuantity;
                    logger.info(`Giới hạn số lượng biến thể: ${maxQuantity}`);
                }
                } else {
                newUserCart.items.push({
                    variationId: guestItem.variationId,
                    quantity: Math.min(guestItem.quantity, maxQuantity),
                });
                mergedItems++;
                }
            }
        
            if (mergedItems === 0 && newUserCart.items.length === 0) {
                logger.warn(`Không có mặt hàng nào được hợp nhất từ guestId: ${guestId}`);
                await Cart.deleteOne({ guestId, userId: null });
                return res.status(200).json({
                success: true,
                message: 'Không có mặt hàng hợp lệ để hợp nhất',
                data: { cart: { items: [] }, totalPrice: 0 },
                });
            }
        
            await newUserCart.save();
            await Cart.deleteOne({ guestId, userId: null });
        
            const populatedCart = await Cart.findById(newUserCart._id).populate({
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
            logger.error(`Lỗi hợp nhất giỏ hàng: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Lỗi server: ' + error.message,
            });
            }
        };