const Promotion = require("../models/promotion.model");

exports.applyPromotion = async (req, res) => {
  const { code, originalPrice } = req.body;

  try {
    const promotion = await Promotion.findOne({ code, isActive: true });
    if (promotion.minOrderValue && originalPrice < promotion.minOrderValue) {
      return res.status(400).json({
        message: `Đơn hàng phải tối thiểu ${promo.minOrderValue} để áp dụng mã này.`,
      });
    }
    if (
      !promotion ||
      (promotion.expiryDate && new Date() > promotion.expiryDate)
    ) {
      return res
        .status(400)
        .json({ message: "Mã khuyến mãi không hợp lệ hoặc đã hết hạn." });
    }

    let finalPrice = originalPrice;
    if (promotion.discountType === "percentage") {
      finalPrice = originalPrice * (1 - promotion.discountValue / 100);
    } else {
      finalPrice = originalPrice - promotion.discountValue;
    }

    finalPrice = finalPrice < 0 ? 0 : finalPrice;

    res.json({
      message: "Áp dụng mã thành công!",
      originalPrice,
      finalPrice,
      promotionApplied: promotion.code,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ.", error: error.message });
  }
};

// Tạo mã khuyến mãi
exports.createPromotion = async (req, res) => {
    try {
      const newPromo = await Promotion.create(req.body);
      res.status(201).json(newPromo);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };
  
  // Cập nhật mã
  exports.updatePromotion = async (req, res) => {
    try {
      const promo = await Promotion.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!promo) return res.status(404).json({ message: 'Không tìm thấy mã' });
      res.json(promo);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };
  
  // Xoá mã
  exports.deletePromotion = async (req, res) => {
    try {
      const promo = await Promotion.findByIdAndDelete(req.params.id);
      if (!promo) return res.status(404).json({ message: 'Không tìm thấy mã' });
      res.json({ message: 'Đã xoá mã thành công' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };
  
  // Lấy danh sách mã
  exports.getAllPromotions = async (req, res) => {
    try {
      const promos = await Promotion.find();
      res.json(promos);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  
