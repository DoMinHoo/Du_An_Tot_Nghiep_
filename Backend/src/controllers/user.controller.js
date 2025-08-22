const User = require("../models/user.model");
const Role = require("../models/roles.model");
require("../models/roles.model");
const { updateUserSchema } = require("../validators/user.validators");
const bcrypt = require("bcryptjs");

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
        message: `Đã ${user.status === "banned" ? "khóa" : "mở khóa"
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


exports.updateProfiles = async (req, res) => {
  const userId = req.user?.userId;
  const { name, address, phone, gender, dateBirth, avatarUrl } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
    }

    user.name = name || user.name;
    user.address = address || user.address;
    user.phone = phone || user.phone;
    user.gender = gender || user.gender;
    user.dateBirth = dateBirth || user.dateBirth;
    user.avatarUrl = avatarUrl || user.avatarUrl;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật', error: error.message });
  }
};


exports.updateAdminUser = async (req, res) => {
  try {
    // Validate đầu vào
    const { error, value } = updateUserSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: error.details.map((err) => err.message),
      });
    }

    const userId = req.params.id;

    // Kiểm tra user có tồn tại
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy user" });
    }

    // Nếu có roleId => kiểm tra role tồn tại
    if (value.roleId) {
      const role = await Role.findById(value.roleId);
      if (!role) {
        return res.status(400).json({ success: false, message: "Role không tồn tại" });
      }
    }

    // Cập nhật
    const updatedUser = await User.findByIdAndUpdate(userId, value, {
      new: true, // trả về user sau khi update
      runValidators: true,
    }).populate("roleId", "name description"); // populate để xem thông tin role

    res.status(200).json({
      success: true,
      message: "Cập nhật user thành công",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};

