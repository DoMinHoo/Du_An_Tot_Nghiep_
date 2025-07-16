const Promotion = require("../models/promotion.model");

// Áp dụng mã khuyến mãi
exports.applyPromotion = async (req, res) => {
  const { code, originalPrice } = req.body;

  try {
    const promotion = await Promotion.findOne({ code: code.toUpperCase(), isActive: true });


    if (!promotion) {
      return res.status(400).json({ message: "Mã khuyến mãi không tồn tại hoặc đã bị vô hiệu hóa." });
    }

    if (promotion.expiryDate && new Date() > promotion.expiryDate) {
      return res.status(400).json({ message: "Mã khuyến mãi đã hết hạn." });
    }

    if (promotion.usageLimit > 0 && promotion.usedCount >= promotion.usageLimit) {
      return res.status(400).json({ message: "Mã khuyến mãi đã đạt giới hạn sử dụng." });
    }

    if (promotion.minOrderValue && originalPrice < promotion.minOrderValue) {
      return res.status(400).json({
        message: `Đơn hàng phải tối thiểu ${promotion.minOrderValue} để áp dụng mã này.`,
      });
    }

    let finalPrice = originalPrice;

    if (promotion.discountType === "percentage") {
      finalPrice = originalPrice * (1 - promotion.discountValue / 100);
    } else {
      finalPrice = originalPrice - promotion.discountValue;
    }

    finalPrice = Math.max(0, finalPrice);

    // Tăng lượt dùng (nếu có giới hạn)
    if (promotion.usageLimit > 0) {
      promotion.usedCount += 1;
      await promotion.save();
    }
    const discountAmount = originalPrice - finalPrice;

    res.json({
      message: "Áp dụng mã thành công!",
      originalPrice,
      finalPrice,
      discountAmount,
      promotionApplied: promotion.code,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ.", error: error.message });
  }
};

exports.createPromotion = async (req, res) => {
  try {
    const data = req.body;
    data.code = data.code?.toUpperCase();
    const newPromo = await Promotion.create(data);
    res.status(201).json(newPromo);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.code) {
      return res.status(400).json({ error: "Mã khuyến mãi đã tồn tại" });
    }
    res.status(400).json({ error: err.message || "Tạo mã thất bại" });
  }
};

// Cập nhật mã khuyến mãi
exports.updatePromotion = async (req, res) => {
  try {
    const data = req.body;
    const promoId = req.params.id;

    if (data.code) {
      data.code = data.code.toUpperCase();

      // Kiểm tra nếu mã đã tồn tại cho một promotion khác
      const existing = await Promotion.findOne({ code: data.code, _id: { $ne: promoId } });
      if (existing) {
        return res.status(400).json({ error: "Mã khuyến mãi đã tồn tại" });
      }
    }

    const promo = await Promotion.findByIdAndUpdate(promoId, data, {
      new: true,
      runValidators: true,
    });

    if (!promo) return res.status(404).json({ message: "Không tìm thấy mã" });

    res.json(promo);
  } catch (err) {
    res.status(400).json({ error: err.message || "Cập nhật mã thất bại" });
  }
};


// Xoá mã khuyến mãi
exports.deletePromotion = async (req, res) => {
  try {
    const promo = await Promotion.findByIdAndDelete(req.params.id);
    if (!promo) return res.status(404).json({ message: 'Không tìm thấy mã' });
    res.json({ message: 'Đã xoá mã thành công' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Lấy danh sách tất cả mã
exports.getAllPromotions = async (req, res) => {
  try {
    const promos = await Promotion.find();
    res.json(promos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy chi tiết mã theo ID (nếu cần)
exports.getPromotionById = async (req, res) => {
  try {
    const promo = await Promotion.findById(req.params.id);
    if (!promo) return res.status(404).json({ message: 'Không tìm thấy mã' });
    res.json(promo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
