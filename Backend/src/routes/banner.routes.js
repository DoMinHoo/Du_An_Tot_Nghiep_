const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload.Banner');
const {
    getBanners,
    getAllBanners,
    createBanner,
    deleteBanner,
    toggleBannerVisibility,
} = require('../controllers/banner.controller');

router.get('/', getBanners); // FE (isActive=true)
router.get('/all', getAllBanners); // Admin
router.post('/', upload.single('image'), createBanner);
router.delete('/:id', deleteBanner);
router.patch('/:id/visibility', toggleBannerVisibility);

module.exports = router;
