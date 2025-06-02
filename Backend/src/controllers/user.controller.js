const User = require("../models/user.model");
require("../models/roles.model");

// [GET] Danh sách tất cả người dùng
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().populate({
      path: "roleId",
      select: "name",
    });
    res.status(200).json(users);
  } catch (error) {
    console.error("❌ Lỗi khi lấy users:", error); // Ghi log toàn bộ lỗi
    res.status(500).json({
      message: "Lỗi lấy danh sách người dùng",
      error: error.message || "Lỗi không xác định",
    });
  }
};


// [GET] Chi tiết người dùng theo ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("roleId", "name");
    if (!user)
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
};

// [PATCH] Khóa hoặc mở khóa người dùng bằng cách thay đổi status
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    user.status = user.status === "active" ? "banned" : "active";
    await user.save();

    res
      .status(200)
      .json({
        message: `Đã ${
          user.status === "banned" ? "khóa" : "mở khóa"
        } người dùng thành công`,
        status: user.status,
      });
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật trạng thái", error });
  }
};
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate(
      "roleId",
      "name"
    );
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("❌ Lỗi khi lấy profile:", error);
    res.status(500).json({
      message: "Lỗi lấy thông tin người dùng",
      error: error.message || "Lỗi không xác định",
    });
  }
};
