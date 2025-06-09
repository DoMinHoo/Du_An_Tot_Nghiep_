const express = require('express');
const router = express.Router();
const variationCtrl = require('../controllers/variation.controller');

// Tạo biến thể dựa trên productId từ URL
router.post('/:productId', variationCtrl.createVariation); //

// Các route khác giữ nguyên
router.get('/:productId', variationCtrl.getVariationsByProductId); // Lấy danh sách biến thể theo productId
router.put('/:id', variationCtrl.updateVariation);// Cập nhật biến thể
router.delete('/:id', variationCtrl.deleteVariation);// Xoá mềm biến thể

module.exports = router;
