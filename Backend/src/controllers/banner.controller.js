// controllers/bannerController.js
const Banner = require('../models/banner.model');
const bannerSchema = require('../validators/banner.validate');
const visibilitySchema = require('../validators/bannerVisibilityValidator');

exports.createBanner = async (req, res) => {
    try {
        const image = req.file?.path?.replace(/\\/g, '/');
        if (!image) {
            return res.status(400).json({ success: false, message: 'Image is required' });
        }

        // Validate body
        const { error, value } = bannerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const newBanner = await Banner.create({ ...value, image });
        res.json({ success: true, data: newBanner });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// controllers/bannerController.js Lấy danh sách banner ko lấy nhưng banner ẩn
exports.getBanners = async (req, res) => {
    try {
        const banners = await Banner.find({ isActive: true }).sort({ position: 1 });
        res.json({ success: true, data: banners });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// controllers/bannerController.js
exports.deleteBanner = async (req, res) => {
    try {
        const { id } = req.params;
        await Banner.findByIdAndDelete(id);
        res.json({ success: true, message: 'Banner deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


// controllers/bannerController.js
exports.toggleBannerVisibility = async (req, res) => {
    try {
        const { error, value } = visibilitySchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const banner = await Banner.findByIdAndUpdate(
            req.params.id,
            { isActive: value.isActive },
            { new: true }
        );

        res.json({ success: true, data: banner });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// /api/banners/all (Bao gồm cả banner ẩn)
exports.getAllBanners = async (req, res) => {
    try {
        const banners = await Banner.find().sort({ position: 1 });
        res.json({ success: true, data: banners });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

