const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { registerSchema } = require('../validators/register.validators');
const { loginSchema } = require('../validators/login.validators');
const { changePasswordSchema } = require('../validators/changePass.validate');
const { generateToken } = require('../middlewares/auth.middleware');
const { sendEmail } = require('../untils/mailers');
const Role = require('../models/roles.model');
const logger = require('../untils/logger');
const Cart = require('../models/cart.model');
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
            password: hashedPassword,
            dateBirth,
            gender,
            status,
            avatarUrl,
            roleId: roleId || (await Role.findOne({ name: 'client' }).select('_id'))._id, // Mặc định là client nếu không có roleId
        });

        // Lưu người dùng vào cơ sở dữ liệu
        await newUser.save();

        // Trả về thông tin người dùng
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
        logger.error('Lỗi khi đăng ký người dùng:', error);
        res.status(500).json({ message: 'Lỗi khi đăng ký người dùng', error: error.message });
    }
};

// Đăng nhập

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate request body
        const { error } = loginSchema.validate({ email, password });
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        // Kiểm tra thông tin đăng nhập
        const user = await User.findOne({ email }).populate('roleId', 'name');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng',
            });
        }

        // Kiểm tra mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng',
            });
        }
// Kiểm tra trạng thái người dùng

if (user.status === 'banned') {
    return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.',
    });
}
        // Kiểm tra vai trò (admin hoặc client)
        const roleName = user.roleId?.name?.trim().toLowerCase();
        if (!['admin', 'client'].includes(roleName)) {
            return res.status(403).json({
                success: false,
                message: 'Vai trò không hợp lệ. Chỉ admin hoặc client được phép đăng nhập.',
            });
        }

        // Gọi hàm generateToken ở đây để tạo JWT
        const token = generateToken({
            _id: user._id,
            role: roleName,
        });

        // Trả về thông tin người dùng và token
        return res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công',
            data: {
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: roleName,
                },
                token,
            },
        });

    } catch (err) {
        console.error('Lỗi đăng nhập:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: err.message
        });
    }
};

// Quên mật khẩu
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        // Kiểm tra xem email có tồn tại trong DB hay không
        const user = await User.findOne({ email }).populate('roleId', 'name');
        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        // Kiểm tra vai trò
        const roleName = user.roleId?.name?.trim().toLowerCase();
        if (!['admin', 'client'].includes(roleName)) {
            return res.status(403).json({ message: 'Vai trò không hợp lệ' });
        }

        // Tạo token cho việc xác thực mật khẩu
        const resetToken = crypto.randomBytes(32).toString('hex');
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
        logger.error('Lỗi gửi email:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra khi gửi email', error: error.message });
    }
};

// Đổi mật khẩu
exports.changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.userId;

    // Validate request body
    const { error } = changePasswordSchema.validate({ oldPassword, newPassword });
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    try {
        const user = await User.findById(userId).populate('roleId', 'name');
        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        // Kiểm tra vai trò
        const roleName = user.roleId?.name?.trim().toLowerCase();
        if (!['admin', 'client'].includes(roleName)) {
            return res.status(403).json({ message: 'Vai trò không hợp lệ' });
        }

        // Kiểm tra mật khẩu cũ
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu cũ không đúng' });
        }

        // Kiểm tra mật khẩu mới không được trùng với mật khẩu cũ
        if (oldPassword === newPassword) {
            return res.status(400).json({ message: 'Mật khẩu mới không thể giống mật khẩu cũ' });
        }

        // Mã hóa mật khẩu mới
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        // Tạo token mới với thông tin vai trò
        const token = generateToken({
            userId: user._id,
            role: roleName,
        });

        res.status(200).json({ message: 'Mật khẩu đã được cập nhật thành công', token });

    } catch (error) {
        logger.error('Lỗi đổi mật khẩu:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra khi đổi mật khẩu', error: error.message });
    }
};