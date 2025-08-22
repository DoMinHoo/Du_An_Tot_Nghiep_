const Role = require("../models/roles.model");

// Lấy danh sách tất cả roles
exports.getRoles = async (req, res) => {
    try {
        const roles = await Role.find().select("_id name description createdAt");
        return res.json({
            success: true,
            data: roles,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Không thể lấy danh sách quyền",
            error: error.message,
        });
    }
};