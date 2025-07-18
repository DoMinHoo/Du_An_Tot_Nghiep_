const express = require("express");
const router = express.Router();
const shippingController = require("../controllers/shipping.controller");

// Lấy danh sách tỉnh/thành, quận/huyện, phường/xã
router.get("/provinces", shippingController.getProvinces);
router.get("/districts/:provinceId", shippingController.getDistricts);
router.get("/wards/:districtId", shippingController.getWards);

// Tính phí vận chuyển
router.post("/fee", shippingController.calculateShippingFee);

module.exports = router;