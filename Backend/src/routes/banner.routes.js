const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const {
    getBanners,
    getAllBanners,
    createBanner,
    deleteBanner,
    toggleBannerVisibility,
    getBannersByCollection,
    updateBanner,
    getBannerById,
} = require('../controllers/banner.controller');

router.get('/', getBanners); // FE (isActive=true)
router.get('/all', getAllBanners); // Admin
router.post('/', upload.single('image'), createBanner);

// route: GET /api/banners/collection/:slug
router.get('/collections/:slug', getBannersByCollection);
router.delete('/:id', deleteBanner);
router.patch('/:id/visibility', toggleBannerVisibility);
router.patch('/:id', upload.single('image'), updateBanner);
router.get('/:id', getBannerById);


module.exports = router;
