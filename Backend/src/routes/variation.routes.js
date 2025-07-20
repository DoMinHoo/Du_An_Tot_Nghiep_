const express = require('express');
const router = express.Router();
const variationCtrl = require('../controllers/variation.controller');
const upload = require('../middlewares/upload');



router.get('/sale', variationCtrl.getSaleProducts);
// Tạo biến thể dựa trên productId từ URL

// Đặt route cụ thể trước route có tham số động (:id)
router.get('/:productId/variations/deleted', variationCtrl.getDeletedVariations);
router.get('/:productId/variations', variationCtrl.getVariationsByProductId);
router.get('/:productId/variations/:id', variationCtrl.getVariationById);
router.post('/:productId/variations', upload.array('images', 5), variationCtrl.createVariation);
router.put('/:productId/variations/:id', upload.array('images', 5), variationCtrl.updateVariation);
router.delete('/:productId/variations/:id', variationCtrl.deleteVariation);
router.patch('/:productId/variations/:id/restore', variationCtrl.restoreVariation);


module.exports = router;