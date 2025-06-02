const express = require('express');
const router = express.Router();
const variationCtrl = require('../controllers/variation.controller');

// Tạo biến thể dựa trên productId từ URL
router.post('/:productId', variationCtrl.createVariation);

// Các route khác giữ nguyên
router.get('/:productId', variationCtrl.getVariationsByProductId);
router.put('/:id', variationCtrl.updateVariation);
router.delete('/:id', variationCtrl.deleteVariation);

module.exports = router;
