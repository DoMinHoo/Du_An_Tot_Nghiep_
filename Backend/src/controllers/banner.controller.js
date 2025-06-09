// controllers/bannerController.js
const Banner = require('../models/banner.model');
const bannerSchema = require('../validators/banner.validate');
const visibilitySchema = require('../validators/bannerVisibilityValidator');
const fs = require('fs');
const path = require('path');

exports.createBanner = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Image is required' });
        }

        // ✅ Tạo đường dẫn URL công khai (FE dùng được)
        const image = `/uploads/banners/${req.file.filename}`;

        // ✅ Validate dữ liệu đầu vào
        const { error, value } = bannerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        // ✅ Tìm position cao nhất hiện tại
        const lastBanner = await Banner.findOne().sort({ position: -1 }).limit(1);
        const nextPosition = lastBanner?.position ? lastBanner.position + 1 : 1;

        // ✅ Tạo dữ liệu banner
        const bannerData = {
            title: value.title,
            link: value.link,
            collection: value.collection,
            isActive: value.isActive ?? true,
            image, // Đường dẫn ảnh công khai
            position: nextPosition,
        };

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
        const banner = await Banner.findById(id);
        if (!banner) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy banner để xóa' });
        }

        // Xóa file ảnh nếu có
        if (banner.image) {
            // banner.image = "/uploads/banners/xxx.jpg"
            const imagePath = path.join(__dirname, '..', 'uploads', banner.image.replace('/uploads/', ''));

            fs.unlink(imagePath, (err) => {
                if (err) {
                    console.error('Lỗi khi xóa file ảnh:', err);
                } else {
                    console.log('Đã xóa file ảnh:', imagePath);
                }
            });
        }

        await Banner.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: 'Xóa banner thành công' });
    } catch (err) {
        console.error('Lỗi xóa banner:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
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

// 📌 Cập nhật banner
exports.updateBanner = async (req, res) => {
    try {
        const { id } = req.params;

        const { error, value } = bannerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const existingBanner = await Banner.findById(id);
        if (!existingBanner) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy banner để cập nhật' });
        }

        const duplicate = await Banner.findOne({
            position: value.position,
            _id: { $ne: id },
        });
        if (duplicate) {
            return res.status(400).json({
                success: false,
                message: `Vị trí ${value.position} đã được sử dụng bởi banner khác.`,
            });
        }

        let updatedFields = {
            title: value.title,
            link: value.link,
            position: value.position,
            collection: value.collection,
            isActive: value.isActive ?? true,
            image: existingBanner.image,
        };

        if (req.file?.path) {
            const fullPath = req.file.path.replace(/\\/g, '/');
            const relativePath = fullPath.split('uploads/')[1];
            updatedFields.image = `/uploads/${relativePath}`; // Dấu / đứng đầu đây
        }

        const updatedBanner = await Banner.findByIdAndUpdate(id, updatedFields, { new: true });

        res.status(200).json({ success: true, data: updatedBanner });
    } catch (err) {
        console.error('❌ Lỗi cập nhật banner:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};



exports.getBannerById = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy banner' });
        }

        // ✅ Đảm bảo đường dẫn ảnh chuẩn hóa nếu frontend cần
        const formattedBanner = {
            ...banner.toObject(),
            image: banner.image?.replace(/\\/g, '/'),
        };

        res.json({ success: true, data: formattedBanner });
    } catch (err) {
        console.error('❌ Lỗi lấy banner theo ID:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};