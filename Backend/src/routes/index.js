const express = require('express');
const router = express.Router();
const userRouter = require('./auth.routes');
const categoryRouter = require('./category.routes');
const userRoutes = require("./user.routes");
const reviewRoutes = require("./review.routes");
const productRoutes = require("./product.routes");
const orderRoutes = require("./order.routes");
const variationRoutes = require("./variation.routes");
const bannerRoutes = require("./banner.routes");
const materialsRoutes = require("./materials.routes");
const statsRoutes = require("./stats.routes");
const vnpayRouter = require('./vnpay');
const postRoutes = require("./post.routes");
const uploadRoute = require("./upload.route");

const promotionRoutes = require("./promotion.route");

const cartRoutes = require("./cart.routes")

const paymentZaloRoutes = require('./payment.routes');

const shippingRoutes = require('./shipping.routes');
const notificationRoutes = require('./notification.routes');

const roleRoutes = require('./role.routes');

router.use('/auth', userRouter);
router.use('/categories', categoryRouter);
router.use("/users", userRoutes);
router.use("/reviews", reviewRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/', variationRoutes);
router.use('/banners', bannerRoutes);
router.use("/promotions", promotionRoutes);
router.use('/carts', cartRoutes);
router.use('/materials', materialsRoutes);
router.use('/stats', statsRoutes);
router.use("/posts", postRoutes);
router.use('/zalo-payment', paymentZaloRoutes)
router.use("/upload", uploadRoute);
router.use('/vnpay', vnpayRouter);
router.use('/shipping', shippingRoutes)
router.use('/notifications', notificationRoutes)
router.use('/roles', roleRoutes)





module.exports = router;
