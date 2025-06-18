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

const promotionRoutes = require("./promotion.route");

const cartRoutes = require("./cart.routes")


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




module.exports = router;
