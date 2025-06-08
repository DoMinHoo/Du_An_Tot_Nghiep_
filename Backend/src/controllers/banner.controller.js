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

        // Validate dữ liệu đầu vào (bỏ qua position vì tự sinh)
        const { error, value } = bannerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        // ✅ Tìm position cao nhất hiện tại
        const lastBanner = await Banner.findOne().sort({ position: -1 }).limit(1);
        const nextPosition = lastBanner?.position ? lastBanner.position + 1 : 1;

        // ✅ Tạo object rõ ràng để tránh Joi loại bỏ position
        const bannerData = {
            title: value.title,
            link: value.link,
            collection: value.collection,
            isActive: value.isActive ?? true,
            image: image,
            position: nextPosition,
        };

        // ✅ Log kiểm tra dữ liệu được lưu
        console.log("📦 Tạo banner mới:", bannerData);

        const newBanner = await Banner.create(bannerData);

        res.status(201).json({ success: true, data: newBanner });
    } catch (err) {
        console.error('❌ Lỗi tạo banner:', err);
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
        const banners = await Banner.find().sort({ position: 1 }); // ✅ Sắp xếp theo position
        res.json({ success: true, data: banners });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getBannersByCollection = async (req, res) => {
    try {
        const { slug } = req.params;
        const banners = await Banner.find({
            collection: slug,
            isActive: true,
        }).sort({ position: 1 });

        res.json({ success: true, data: banners });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateBanner = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate dữ liệu body (không validate image tại đây)
        const { error, value } = bannerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        // Xử lý ảnh nếu có
        let updatedFields = { ...value };
        if (req.file?.path) {
            updatedFields.image = req.file.path.replace(/\\/g, '/'); // chuẩn hóa đường dẫn
        }
        const existing = await Banner.findOne({ position: value.position, _id: { $ne: id } });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: `Vị trí ${value.position} đã được dùng bởi banner khác.`,
            });
        }

        const updatedBanner = await Banner.findByIdAndUpdate(id, updatedFields, { new: true });

        if (!updatedBanner) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy banner để cập nhật' });
        }

        res.status(200).json({ success: true, data: updatedBanner });
    } catch (err) {
        console.error('Lỗi cập nhật banner:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};
exports.getBannerById = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) return res.status(404).json({ success: false, message: 'Không tìm thấy banner' });

        res.json({ success: true, data: banner });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};