const Material = require("../models/material.model");
const { materialValidation } = require("../validators/material.validate");


const addMaterial = async (req, res) => {
    // Bước 1: Validate định dạng dữ liệu
    const { error } = materialValidation.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    try {
        // Bước 2: Kiểm tra tên đã tồn tại (không phân biệt hoa thường)
        const existing = await Material.findOne({ name: new RegExp(`^${req.body.name}$`, 'i') });
        if (existing) {
            return res.status(409).json({ message: "Tên chất liệu đã tồn tại." });
        }

        // Bước 3: Tạo và lưu mới
        const newMaterial = new Material({ name: req.body.name });
        const saved = await newMaterial.save();

        res.status(201).json(saved);
    } catch (err) {
        res.status(500).json({ message: "Lỗi server", error: err.message });
    }
};

const getAllMaterials = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Mặc định trang 1
        const limit = 10;
        const skip = (page - 1) * limit;

        const [materials, total] = await Promise.all([
            Material.find()
                .sort({ createdAt: -1 }) // Mới nhất trước
                .skip(skip)
                .limit(limit),
            Material.countDocuments()
        ]);

        res.status(200).json({
            totalItems: total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            data: materials
        });
    } catch (err) {
        res.status(500).json({ message: "Lỗi khi lấy danh sách chất liệu", error: err.message });
    }
};

const updateMaterial = async (req, res) => {
    const { id } = req.params;

    // Validate dữ liệu đầu vào
    const { error } = materialValidation.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    try {
        // Kiểm tra trùng tên (ngoại trừ chính nó)
        const exists = await Material.findOne({
            name: new RegExp(`^${req.body.name}$`, 'i'),
            _id: { $ne: id } // loại trừ chính bản thân
        });

        if (exists) {
            return res.status(409).json({ message: "Tên chất liệu đã tồn tại." });
        }

        const updated = await Material.findByIdAndUpdate(
            id,
            { name: req.body.name },
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "Không tìm thấy chất liệu." });
        }

        res.status(200).json(updated);
    } catch (err) {
        res.status(500).json({ message: "Lỗi khi cập nhật chất liệu", error: err.message });
    }
};

const getMaterialById = async (req, res) => {
    const { id } = req.params;

    try {
        const material = await Material.findById(id);
        if (!material) {
            return res.status(404).json({ message: "Không tìm thấy chất liệu." });
        }

        res.status(200).json(material);
    } catch (err) {
        res.status(500).json({ message: "Lỗi khi lấy chất liệu", error: err.message });
    }
};

const deleteMaterialById = async (req, res) => {
    const { id } = req.params;

    try {
        const deleted = await Material.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({ message: "Không tìm thấy chất liệu để xóa." });
        }

        res.status(200).json({
            message: "Xóa chất liệu thành công.",
            deletedMaterial: deleted
        });
    } catch (err) {
        res.status(500).json({ message: "Lỗi khi xóa chất liệu", error: err.message });
    }
};
module.exports = { addMaterial, getAllMaterials, updateMaterial, getMaterialById, deleteMaterialById };


