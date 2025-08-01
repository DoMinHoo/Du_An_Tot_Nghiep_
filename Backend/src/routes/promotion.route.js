// src/routes/promotion.routes.js
const express = require("express");
const router = express.Router();
const promotionController = require("../controllers/promotion.controller");

router.post("/apply", promotionController.applyPromotion);
router.post("/", promotionController.createPromotion);
router.get("/", promotionController.getAllPromotions);
router.get("/deleted", promotionController.getDeletedPromotions); // Lấy danh sách mã đã xóa mềm
router.get("/:id", promotionController.getPromotionById);
router.put("/:id", promotionController.updatePromotion);
router.delete("/:id", promotionController.softDeletePromotion); // Xóa mềm
router.delete("/:id/permanent", promotionController.permanentDeletePromotion); // Xóa vĩnh viễn
router.put("/:id/restore", promotionController.restorePromotion); // Khôi phục

module.exports = router;