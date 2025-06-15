const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { registerSchema } = require('../validators/register.validators');
const { loginSchema } = require('../validators/login.validators');
const { changePasswordSchema } = require('../validators/changePass.validate');
const { generateToken } = require('../middlewares/auth.middleware');
const { sendEmail } = require('../untils/mailers'); // Giả sử bạn đã có hàm gửi email
const Role = require('../models/roles.model');

const jwt = require('jsonwebtoken');



// Đăng ký người dùng
exports.register = async (req, res) => {
    // Validate request body using Joi schema
    const { error } = registerSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const { name, address, phone, email, password, dateBirth, gender, status, avatarUrl, roleId } = req.body;

    try {
        // Kiểm tra xem email có tồn tại trong cơ sở dữ liệu hay không
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email đã tồn tại' });
        }

        // Mã hóa mật khẩu trước khi lưu vào cơ sở dữ liệu
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo đối tượng người dùng mới
        const newUser = new User({
            name,
            address,
            phone,
            email,
            password: hashedPassword,  // Lưu mật khẩu đã mã hóa
            dateBirth,
            gender,
            status,
            avatarUrl,
            roleId,
        });

        // Lưu người dùng vào cơ sở dữ liệu
        await newUser.save();

        // Trả về thông tin người dùng (có thể không trả về mật khẩu)
        res.status(201).json({
            message: 'Đăng ký thành công!',
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                address: newUser.address,
                phone: newUser.phone,
                gender: newUser.gender,
                status: newUser.status,
                avatarUrl: newUser.avatarUrl,
                roleId: newUser.roleId,
                createdAt: newUser.createdAt,
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi đăng ký người dùng', error: error.message });
    }
};

// Đăng nhập
// Đăng nhập
exports.login = async (req, res) => {
    const { error } = loginSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }
        if (user.status === 'banned') {
    return res.status(403).json({ message: 'Tài khoản đã bị khóa, vui lòng liên hệ Admin' });
}

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu không đúng' });
        }

        // JOIN sang role để lấy tên
        const role = await Role.findById(user.roleId);
        if (!role) {
            return res.status(400).json({ message: 'User không có role hợp lệ' });
        }

        // Tạo token với role là tên role, viết thường, loại bỏ khoảng trắng/dấu
        const token = generateToken({
            _id: user._id,
            role: role.name.trim().toLowerCase() // <-- Rất quan trọng!
        });

        res.status(200).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                address: user.address,
                phone: user.phone,
                gender: user.gender,
                status: user.status,
                avatarUrl: user.avatarUrl,
                role: role.name, // trả về luôn role name cho FE
                createdAt: user.createdAt,
            }
        });

    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra khi đăng nhập', error: error.message });
    }
};


exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        // Kiểm tra xem email có tồn tại trong DB hay không
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        // Tạo token cho việc xác thực mật khẩu
        const resetToken = crypto.randomBytes(32).toString('hex'); // Mã token tạm thời
        const resetTokenExpiry = Date.now() + 3600000; // Token hết hạn sau 1 giờ

        // Lưu token và thời gian hết hạn vào DB
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpire = resetTokenExpiry;
        await user.save();

        // Gửi email với liên kết reset mật khẩu
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        const emailSubject = 'Đặt lại mật khẩu của bạn';
        const emailText = `Xin chào, để đặt lại mật khẩu của bạn, vui lòng nhấn vào liên kết dưới đây:\n\n${resetUrl}`;

        // Gửi email
        await sendEmail(email, emailSubject, emailText);

        res.status(200).json({ message: 'Email đặt lại mật khẩu đã được gửi' });

    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra khi gửi email', error: error.message });
    }

}

exports.changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.userId;

    const { error } = changePasswordSchema.validate({ oldPassword, newPassword });
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu cũ không đúng' });
        }

        if (oldPassword === newPassword) {
            return res.status(400).json({ message: 'Mật khẩu mới không thể giống mật khẩu cũ' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        // JOIN lại role
        const role = await Role.findById(user.roleId);
        const token = generateToken({
            _id: user._id,
            role: role ? role.name.trim().toLowerCase() : 'user'
        });

        res.status(200).json({ message: 'Mật khẩu đã được cập nhật thành công', token });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra khi đổi mật khẩu' });
    }
};

