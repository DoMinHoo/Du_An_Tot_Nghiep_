const express = require('express');
const router = express.Router();
const userRouter = require('./user.routes');
const categoryRouter = require('./category.routes');

router.use('/auth', userRouter);
router.use('/categories', categoryRouter);



module.exports = router;
