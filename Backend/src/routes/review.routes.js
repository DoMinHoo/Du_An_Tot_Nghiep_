const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const authMiddleware = require("../middlewares/auth.middleware");
const { protect } = require("../middlewares/auth.middleware");

router.get("/", protect(["admin"]), reviewController.getAllReviews);
// Tạo đánh giá
router.post('/', verifyToken, reviewController.createReview);

// Lấy chi tiết đánh giá
router.get('/:id', reviewController.getReviewById);

// Cập nhật đánh giá
router.put('/:id', verifyToken, reviewController.updateReview);

// Xoá đánh giá
router.delete('/:id', verifyToken, reviewController.deleteReview);

module.exports = router;
