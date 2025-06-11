    // controllers/cart.controller.js
    const Cart = require('../models/cart.model');
    const Product = require('../models/products.model'); // Giả sử bạn đã có model Product

    // 1. Thêm sản phẩm vào giỏ hàng
    exports.addToCart = async (req, res) => {
        try {
            const { productId, quantity } = req.body;
            const userId = req.user._id;

            // Kiểm tra sản phẩm có tồn tại
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Sản phẩm không tồn tại'
                });
            }

            // Tìm giỏ hàng của user
            let cart = await Cart.findOne({ userId });

            if (!cart) {
                // Nếu chưa có giỏ hàng, tạo mới
                cart = new Cart({
                    userId,
                    items: [{ productId, quantity: quantity || 1 }]
                });
            } else {
                // Kiểm tra sản phẩm đã có trong giỏ chưa
                const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
                
                if (itemIndex > -1) {
                    // Nếu sản phẩm đã có, tăng số lượng
                    cart.items[itemIndex].quantity += quantity || 1;
                } else {
                    // Nếu chưa có, thêm sản phẩm mới
                    cart.items.push({ productId, quantity: quantity || 1 });
                }
            }

            await cart.save();
            res.status(200).json({
                success: true,
                message: 'Thêm sản phẩm vào giỏ hàng thành công',
                data: cart
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi server: ' + error.message
            });
        }
    };

    // 2. Cập nhật số lượng sản phẩm trong giỏ
    exports.updateCartItem = async (req, res) => {
        try {
            const { productId, quantity } = req.body;
            const userId = req.user._id;

            // Kiểm tra số lượng hợp lệ
            if (quantity < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Số lượng phải lớn hơn 0'
                });
            }

            // Tìm giỏ hàng
            const cart = await Cart.findOne({ userId });
            if (!cart) {
                return res.status(404).json({
                    success: false,
                    message: 'Giỏ hàng không tồn tại'
                });
            }

            // Tìm và cập nhật sản phẩm
            const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
            if (itemIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Sản phẩm không có trong giỏ hàng'
                });
            }

            cart.items[itemIndex].quantity = quantity;
            await cart.save();

            res.status(200).json({
                success: true,
                message: 'Cập nhật số lượng thành công',
                data: cart
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi server: ' + error.message
            });
        }
    };

    // 3. Xóa một sản phẩm khỏi giỏ hàng
    exports.removeCartItem = async (req, res) => {
        try {
            const { productId } = req.params;
            const userId = req.user._id;

            const cart = await Cart.findOne({ userId });
            if (!cart) {
                return res.status(404).json({
                    success: false,
                    message: 'Giỏ hàng không tồn tại'
                });
            }

            // Lọc bỏ sản phẩm
            cart.items = cart.items.filter(item => item.productId.toString() !== productId);
            await cart.save();

            res.status(200).json({
                success: true,
                message: 'Xóa sản phẩm khỏi giỏ hàng thành công',
                data: cart
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi server: ' + error.message
            });
        }
    };

    // 4. Xóa toàn bộ giỏ hàng
    exports.clearCart = async (req, res) => {
        try {
            const userId = req.user._id;

            const cart = await Cart.findOne({ userId });
            if (!cart) {
                return res.status(404).json({
                    success: false,
                    message: 'Giỏ hàng không tồn tại'
                });
            }

            cart.items = [];
            await cart.save();

            res.status(200).json({
                success: true,
                message: 'Xóa toàn bộ giỏ hàng thành công',
                data: cart
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi server: ' + error.message
            });
        }
    };

    // 5. Lấy thông tin giỏ hàng
    exports.getCart = async (req, res) => {
        try {
            const userId = req.user._id;

            const cart = await Cart.findOne({ userId }).populate('items.productId');
            if (!cart) {
                return res.status(404).json({
                    success: false,
                    message: 'Giỏ hàng không tồn tại'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Lấy giỏ hàng thành công',
                data: cart
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi server: ' + error.message
            });
        }
    };