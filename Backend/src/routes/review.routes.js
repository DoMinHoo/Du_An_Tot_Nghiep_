const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/review.controller");
const { verifyToken, protect } = require("../middlewares/auth.middleware");

// 📌 Đặt các route cụ thể TRƯỚC
router.get("/product/:productId", reviewController.getReviewsByProduct);
router.patch(
  "/:id/visibility",
  protect(["admin"]),
  reviewController.toggleVisibility
);
router.patch("/:id/flag", protect(["admin"]), reviewController.toggleFlag);
router.post("/:id/reply", verifyToken, reviewController.addReply);

// 📌 Các route động phải để SAU
router.get("/:id", reviewController.getReviewById);
router.put("/:id", verifyToken, reviewController.updateReview);
router.delete("/:id", verifyToken, reviewController.deleteReview);

// Tổng quan
router.get("/", protect(["admin"]), reviewController.getAllReviews);
router.post("/", verifyToken, reviewController.createReview);

module.exports = router;
