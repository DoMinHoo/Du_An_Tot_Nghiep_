const express = require('express');
const router = express.Router();
const userRouter = require('./auth.routes');
const categoryRouter = require('./category.routes');
const userRoutes = require("./user.routes");
const reviewRoutes = require("./review.routes");
const productRoutes = require("./product.routes");
const orderRoutes = require("./order.routes");
const cartRoutes = require("./cart.routes");
const variationRoutes = require("./variation.routes");
const bannerRoutes = require("./banner.routes");
const paymentRoutes = require("./payment.router");

router.use('/auth', userRouter);
router.use('/categories', categoryRouter);
router.use("/users", userRoutes);
router.use("/reviews", reviewRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/carts', cartRoutes);
router.use('/variations', variationRoutes);
router.use('/banners', bannerRoutes);
router.use('/payments', paymentRoutes);





module.exports = router;
