const mongoose = require("mongoose");
const Order = require("../models/order.model");
const ProductVariation = require("../models/product_variations.model");
const Review = require("../models/review.model");
require("../models/review.model");
// Tạo mới
exports.createReview = async (req, res) => {
  try {
    const { product, rating, comment } = req.body;

    // ✅ Kiểm tra input bắt buộc
    if (!product || !rating) {
      return res
        .status(400)
        .json({ message: "Thiếu thông tin đánh giá (product, rating)." });
    }

    // 1. Tìm tất cả variationId thuộc product đó
    const variations = await ProductVariation.find({
      productId: product,
    }).select("_id");
    const variationIds = variations.map((v) => v._id.toString());

    console.log("🧩 variationIds:", variationIds);

    if (variationIds.length === 0) {
      return res
        .status(404)
        .json({ message: "Sản phẩm không có biến thể nào để đánh giá." });
    }

    // 2. Kiểm tra người dùng có đơn hàng hoàn tất chứa variation không
    const orders = await Order.find({
      userId: req.user.userId,
      status: { $in: ["completed", "pending"] },
    });

    console.log("🧾 Orders chứa variation:", JSON.stringify(orders, null, 2));

    const hasPurchased = orders.length > 0;

    if (!hasPurchased) {
      return res
        .status(403)
        .json({ message: "Bạn chỉ có thể đánh giá sản phẩm khi đã mua hàng." });
    }

    // 3. Kiểm tra đã từng đánh giá sản phẩm chưa
    const alreadyReviewed = await Review.findOne({
      product,
      user: req.user.userId,
    });

    if (alreadyReviewed) {
      return res
        .status(400)
        .json({ message: "Bạn đã đánh giá sản phẩm này rồi." });
    }

    // 4. Tạo review mới
    const review = new Review({
      product,
      user: req.user.userId,
      rating,
      comment,
    });

    await review.save();
    res.status(201).json(review);
  } catch (error) {
    console.error("❌ Lỗi khi tạo review:", error);
    res.status(500).json({ message: "Lỗi tạo review", error: error.message });
  }
};


// Lấy chi tiết
exports.getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id).populate(
      "user",
      "name"
    );
    if (!review) return res.status(404).json({ message: "Not found" });
    res.json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Cập nhật
exports.updateReview = async (req, res) => {
  try {
    // Tìm review theo ID
    const review = await Review.findById(req.params.id);
    if (!review)
      return res.status(404).json({ message: "Không tìm thấy review" });

    // Kiểm tra xem người dùng có quyền cập nhật không (người tạo review hoặc admin)
    if (
      review.user.toString() !== req.user.userId &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền sửa review này" });
    }

    // Cập nhật review
    review.rating = req.body.rating || review.rating;
    review.comment = req.body.comment || review.comment;
    await review.save();

    // Trả về review đã cập nhật
    res.status(200).json(review);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi cập nhật review", error: err.message });
  }
};

// Xóa
exports.deleteReview = async (req, res) => {
  try {
    // Tìm review theo ID
    const review = await Review.findById(req.params.id);
    if (!review)
      return res.status(404).json({ message: "Không tìm thấy review" });

    // Kiểm tra xem người dùng có quyền xóa không (người tạo review hoặc admin)
    if (
      review.user.toString() !== req.user.userId &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xóa review này" });
    }

    // Nếu có quyền, tiến hành xóa review
    await review.deleteOne();

    // Trả về thông báo xoá thành công
    res.status(200).json({ message: "Xóa đánh giá thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi xóa review", error: err.message });
  }
};

// Lấy tất cả đánh giá (có phân trang hoặc không)
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("user", "name") // Lấy tên người đánh giá
      .populate("product", "name"); // Lấy tên sản phẩm

    res.status(200).json(reviews);
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy danh sách đánh giá", error: err.message });
  }
};

