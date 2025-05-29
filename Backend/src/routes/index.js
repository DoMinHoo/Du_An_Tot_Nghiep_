const express = require('express');
const router = express.Router();
const userRouter = require('./auth.routes');
const categoryRouter = require('./category.routes');
const userRoutes = require("./user.routes");

router.use('/auth', userRouter);
router.use('/categories', categoryRouter);
router.use("/users", userRoutes);


module.exports = router;
