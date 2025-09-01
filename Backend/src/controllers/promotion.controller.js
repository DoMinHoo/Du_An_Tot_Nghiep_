// src/controllers/promotion.controller.js
const Promotion = require("../models/promotion.model");

// Áp dụng mã khuyến mãi
// Áp dụng mã khuyến mãi
exports.applyPromotion = async (req, res) => {
  const { code, originalPrice } = req.body;

  try {
    const promotion = await Promotion.findOne({
      code: code.toUpperCase(),
      isActive: true,
      isDeleted: false,
    });

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

    let discountAmount = 0;

    // Tính số tiền giảm
    if (promotion.discountType === "percentage") {
      discountAmount = originalPrice * (promotion.discountValue / 100);
    } else {
      discountAmount = promotion.discountValue;
    }

    // ✅ Giới hạn mức giảm tối đa nếu có
    if (promotion.maxDiscountPrice > 0) {
      discountAmount = Math.min(discountAmount, promotion.maxDiscountPrice);
    }

    const finalPrice = Math.max(0, originalPrice - discountAmount);

    // Cập nhật lượt sử dụng
    // if (promotion.usageLimit > 0) {
    //   promotion.usedCount += 1;
    //   await promotion.save();
    // }

    res.json({
      message: "Áp dụng mã thành công!",
      originalPrice,
      finalPrice,
      discountAmount,
      maxDiscountPrice: promotion.maxDiscountPrice || 0, // ✅ thêm dòng này
      promotionApplied: promotion.code,
    });

  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ.", error: error.message });
  }
};


// Tạo mã khuyến mãi
exports.createPromotion = async (req, res) => {
  try {
    // DEBUG: log payload để kiểm tra client gửi gì
    console.log('[createPromotion] body:', req.body);

    // clone và sanitize input
    const raw = { ...(req.body || {}) };

    // chuẩn hoá code
    if (raw.code) raw.code = String(raw.code).trim().toUpperCase();

    // ép kiểu và gán default nếu thiếu
    const promotionData = {
      code: raw.code,
      discountType: raw.discountType ? String(raw.discountType).trim() : undefined,
      discountValue: raw.discountValue !== undefined ? Number(raw.discountValue) : undefined,
      maxDiscountPrice: raw.maxDiscountPrice !== undefined ? Number(raw.maxDiscountPrice) : 0,
      expiryDate: raw.expiryDate ? new Date(raw.expiryDate) : undefined,
      isActive: raw.isActive !== undefined ? Boolean(raw.isActive) : true,
      minOrderValue: raw.minOrderValue !== undefined ? Number(raw.minOrderValue) : 0,
      usageLimit: raw.usageLimit !== undefined ? Number(raw.usageLimit) : 0,
      // never allow client to set usedCount directly on create (force 0)
      usedCount: 0,
      isDeleted: false,
      deletedAt: null,
    };

    // Basic validation before create (so we return clear messages)
    if (!promotionData.code) return res.status(400).json({ error: 'code là bắt buộc' });
    if (!promotionData.discountType) return res.status(400).json({ error: 'discountType là bắt buộc' });
    if (!['percentage', 'fixed'].includes(promotionData.discountType))
      return res.status(400).json({ error: 'discountType phải là "percentage" hoặc "fixed"' });
    if (promotionData.discountValue === undefined || Number.isNaN(promotionData.discountValue))
      return res.status(400).json({ error: 'discountValue không hợp lệ' });

    // Tạo
    const newPromo = await Promotion.create(promotionData);

    // Trả về toàn bộ document tạo xong
    return res.status(201).json({ success: true, data: newPromo });
  } catch (err) {
    console.error('[createPromotion] error:', err);

    if (err.code === 11000 && err.keyPattern?.code) {
      return res.status(400).json({ error: "Mã khuyến mãi đã tồn tại" });
    }

    // Nếu Mongoose validation error, trả chi tiết
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ error: messages.join('; ') });
    }

    return res.status(400).json({ error: err.message || "Tạo mã thất bại" });
  }
};


// Cập nhật mã khuyến mãi
exports.updatePromotion = async (req, res) => {
  try {
    const data = req.body;
    const promoId = req.params.id;

    if (data.code) {
      data.code = data.code.toUpperCase();
      const existing = await Promotion.findOne({
        code: data.code,
        _id: { $ne: promoId },
        isDeleted: false, // Chỉ kiểm tra trong các mã chưa bị xóa mềm
      });
      if (existing) {
        return res.status(400).json({ error: "Mã khuyến mãi đã tồn tại" });
      }
    }

    const promo = await Promotion.findOneAndUpdate(
      { _id: promoId, isDeleted: false }, // Chỉ cập nhật nếu chưa bị xóa mềm
      data,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!promo) return res.status(404).json({ message: "Không tìm thấy mã" });

    res.json(promo);
  } catch (err) {
    res.status(400).json({ error: err.message || "Cập nhật mã thất bại" });
  }
};

// Xóa mềm mã khuyến mãi
exports.softDeletePromotion = async (req, res) => {
  try {
    const promo = await Promotion.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
    if (!promo) {
      return res.status(404).json({ message: "Không tìm thấy mã hoặc mã đã bị xóa" });
    }
    res.json({ message: "Đã xóa mềm mã thành công", promo });
  } catch (err) {
    res.status(400).json({ error: err.message || "Xóa mềm mã thất bại" });
  }
};

// Khôi phục mã khuyến mãi
exports.restorePromotion = async (req, res) => {
  try {
    const promo = await Promotion.findOneAndUpdate(
      { _id: req.params.id, isDeleted: true },
      { isDeleted: false, deletedAt: null },
      { new: true }
    );
    if (!promo) {
      return res.status(404).json({ message: "Không tìm thấy mã hoặc mã chưa bị xóa mềm" });
    }
    res.json({ message: "Đã khôi phục mã thành công", promo });
  } catch (err) {
    res.status(400).json({ error: err.message || "Khôi phục mã thất bại" });
  }
};

// Xóa vĩnh viễn mã khuyến mãi
exports.permanentDeletePromotion = async (req, res) => {
  try {
    const promo = await Promotion.findByIdAndDelete(req.params.id);
    if (!promo) {
      return res.status(404).json({ message: "Không tìm thấy mã" });
    }
    res.json({ message: "Đã xóa vĩnh viễn mã thành công" });
  } catch (err) {
    res.status(400).json({ error: err.message || "Xóa vĩnh viễn mã thất bại" });
  }
};

// Lấy danh sách tất cả mã (chưa bị xóa mềm)
exports.getAllPromotions = async (req, res) => {
  try {
    const promos = await Promotion.find({ isDeleted: false });
    res.json(promos);
  } catch (err) {
    res.status(500).json({ error: err.message || "Lấy danh sách mã thất bại" });
  }
};

// Lấy danh sách mã đã xóa mềm
exports.getDeletedPromotions = async (req, res) => {
  try {
    const promos = await Promotion.find({ isDeleted: true });
    res.json(promos);
  } catch (err) {
    res.status(500).json({ error: err.message || "Lấy danh sách mã đã xóa thất bại" });
  }
};

// Lấy chi tiết mã theo ID
exports.getPromotionById = async (req, res) => {
  try {
    const promo = await Promotion.findById(req.params.id);
    if (!promo) return res.status(404).json({ message: "Không tìm thấy mã" });
    res.json(promo);
  } catch (err) {
    res.status(500).json({ error: err.message || "Lấy chi tiết mã thất bại" });
  }
};