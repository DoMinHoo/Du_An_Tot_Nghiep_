const express = require('express');
const router = express.Router();
const variationCtrl = require('../controllers/variation.controller');
const upload = require('../middlewares/upload');

// Tạo biến thể dựa trên productId từ URL
router.post('/:productId/variations',upload.array('images', 5), variationCtrl.createVariation); //

// Các route khác giữ nguyên
router.get('/:productId/variations', variationCtrl.getVariationsByProductId); // Lấy danh sách biến thể theo productId
router.put('/:productId/variations/:id',upload.array('images', 5), variationCtrl.updateVariation);// Cập nhật biến thể
router.get('/:productId/variations/:id', variationCtrl.getVariationById);// Lấy chi tiết biến thể
router.delete('/:productId/variations/:id', variationCtrl.deleteVariation);// Xoá mềm biến thể

module.exports = router;
