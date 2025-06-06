const User = require("../models/user.model");
require("../models/roles.model");
const { updateUserSchema } = require("../validators/user.validators");

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
  const { error } = updateUserSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { name, email, phone, address, avatarUrl, dateOfBirth, gender } = req.body;
  const userId = req.user.userId;

  try {
    // Kiểm tra xem email có bị trùng với người khác không
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({ message: 'Email đã được sử dụng bởi người khác' });
      }
    }

    // Tạo đối tượng chứa các trường được cập nhật
    const updatedFields = {};

    if (name && name !== "") updatedFields.name = name;
    if (email && email !== "") updatedFields.email = email;
    if (phone && phone !== "") updatedFields.phone = phone;
    if (address && address !== "") updatedFields.address = address;
    if (avatarUrl && avatarUrl !== "") updatedFields.avatarUrl = avatarUrl;
    if (dateOfBirth) updatedFields.dateOfBirth = dateOfBirth;
    if (gender) updatedFields.gender = gender;

    // Kiểm tra xem có trường nào cần cập nhật không
    if (Object.keys(updatedFields).length === 0) {
      return res.status(400).json({ message: 'Không có thông tin nào để cập nhật' });
    }

    // Cập nhật thông tin người dùng
    const updatedUser = await User.findByIdAndUpdate(userId, updatedFields, { new: true });

    // Kiểm tra nếu người dùng không tồn tại
    if (!updatedUser) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Gửi phản hồi với dữ liệu đã cập nhật
    return res.status(200).json(updatedUser);

  } catch (err) {
    console.error('Lỗi khi cập nhật thông tin:', err);
    return res.status(500).json({ message: 'Có lỗi xảy ra khi cập nhật thông tin tài khoản' });
  }
};


