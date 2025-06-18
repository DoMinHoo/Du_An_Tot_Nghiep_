// src/routes/promotion.routes.js
const express = require("express");
const router = express.Router();
const promotionController = require("../controllers/promotion.controller");

router.post("/apply", promotionController.applyPromotion);
router.post("/", promotionController.createPromotion);
router.get("/", promotionController.getAllPromotions);
router.get("/:id", promotionController.getPromotionById);
router.put("/:id", promotionController.updatePromotion);
router.delete("/:id", promotionController.deletePromotion);

module.exports = router;
