const Review = require("../models/review.model");
require("../models/review.model");
// Tạo mới
exports.createReview = async (req, res) => {
  try {
    // Lấy thông tin từ request body
    const { product, rating, comment } = req.body;

    // Thêm thông tin user vào dữ liệu review
    const review = new Review({
      product,
      user: req.user.userId, // Lấy userId từ req.user (được xác thực trong middleware)
      rating,
      comment,
    });

    // Lưu review vào database
    await review.save();

    res.status(201).json(review); // Trả về đánh giá mới
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
