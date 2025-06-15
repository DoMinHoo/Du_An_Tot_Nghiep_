const router = require("express").Router();
const {
  applyPromotion,
  createPromotion,
  updatePromotion,
  deletePromotion,
  getAllPromotions,
} = require("../controllers/promotion.controller");

router.post("/apply", applyPromotion);
router.post("/", createPromotion);
router.put("/:id", updatePromotion);
router.delete("/:id", deletePromotion);
router.get("/", getAllPromotions);

module.exports = router;
