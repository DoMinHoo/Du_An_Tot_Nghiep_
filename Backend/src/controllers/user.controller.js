const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { registerSchema } = require('../validators/register.validators');
const { loginSchema } = require('../validators/login.validators');
const { generateToken } = require('../middlewares/auth.middleware');
const { sendEmail } = require('../untils/mailers'); // Giả sử bạn đã có hàm gửi email

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
exports.login = async (req, res) => {
    const { error } = loginSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const { email, password } = req.body;

    try {
        // Tìm người dùng trong DB
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        // Kiểm tra mật khẩu
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Mật khẩu không đúng' });
        }

        // Tạo JWT token
        const token = generateToken(user);

        // Trả về token
        res.status(200).json({ token });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
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
