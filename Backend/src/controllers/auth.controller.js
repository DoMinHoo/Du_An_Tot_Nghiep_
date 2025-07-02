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

exports.register = async (req, res) => {
    const { error } = registerSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { name, address, phone, email, password, dateBirth, gender, status, avatarUrl, roleId } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email đã tồn tại' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

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
            roleId: roleId || (await Role.findOne({ name: 'client' }).select('_id'))._id,
        });

        await newUser.save();

        res.status(201).json({
            success: true,
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
            },
        });
    } catch (error) {
        logger.error('Lỗi khi đăng ký người dùng:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi khi đăng ký người dùng', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const { error } = loginSchema.validate({ email, password });
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const user = await User.findOne({ email }).populate('roleId', 'name');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng',
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng',
            });
        }

        if (user.status === 'banned') {
            return res.status(403).json({
                success: false,
                message: 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.',
            });
        }

        const roleName = user.roleId?.name?.trim().toLowerCase();
        if (!['admin', 'client'].includes(roleName)) {
            return res.status(403).json({
                success: false,
                message: 'Vai trò không hợp lệ. Chỉ admin hoặc client được phép đăng nhập.',
            });
        }

        const token = generateToken({
            _id: user._id,
            role: roleName,
        });

        return res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công',
            data: {
                user: {
                    _id: user._id,
            name: user.name,
            address: user.address,
            phone: user.phone,
            email: user.email,
            dateBirth: user.dateBirth,
            gender: user.gender,
            status: user.status,
            avatarUrl: user.avatarUrl,
            roleId:roleName, 
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
                },
                token,
            },
        });
    } catch (err) {
        logger.error('Lỗi đăng nhập:', err.message);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: err.message,
        });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email }).populate('roleId', 'name');
        if (!user) {
            return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
        }

        const roleName = user.roleId?.name?.trim().toLowerCase();
        if (!['admin', 'client'].includes(roleName)) {
            return res.status(403).json({ success: false, message: 'Vai trò không hợp lệ' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000;

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpire = resetTokenExpiry;
        await user.save();

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        const emailSubject = 'Đặt lại mật khẩu của bạn';
        const emailText = `Xin chào, để đặt lại mật khẩu của bạn, vui lòng nhấn vào liên kết dưới đây:\n\n${resetUrl}`;

        await sendEmail(email, emailSubject, emailText);

        res.status(200).json({ success: true, message: 'Email đặt lại mật khẩu đã được gửi' });
    } catch (error) {
        logger.error('Lỗi gửi email:', error.message);
        res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi gửi email', error: error.message });
    }
};

exports.changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.userId;

    const { error } = changePasswordSchema.validate({ oldPassword, newPassword });
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }

    try {
        const user = await User.findById(userId).populate('roleId', 'name');
        if (!user) {
            return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
        }

        const roleName = user.roleId?.name?.trim().toLowerCase();
        if (!['admin', 'client'].includes(roleName)) {
            return res.status(403).json({ success: false, message: 'Vai trò không hợp lệ' });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Mật khẩu cũ không đúng' });
        }

        if (oldPassword === newPassword) {
            return res.status(400).json({ success: false, message: 'Mật khẩu mới không thể giống mật khẩu cũ' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        const token = generateToken({
            userId: user._id,
            role: roleName,
        });

        res.status(200).json({ success: true, message: 'Mật khẩu đã được cập nhật thành công', token });
    } catch (error) {
        logger.error('Lỗi đổi mật khẩu:', error.message);
        res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi đổi mật khẩu', error: error.message });
    }
};