const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { registerSchema } = require('../validators/register.validators');
const validator = require('validator');  // Thư viện để kiểm tra tính hợp lệ của email


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
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Sai email hoặc mật khẩu' });
        }

        if (user.isLocked) {
            return res.status(403).json({ message: 'Tài khoản đã bị khóa' });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '7d'
        });

        res.json({
            message: 'Đăng nhập thành công',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi đăng nhập', error: err.message });
    }
};

// Lấy danh sách người dùng
exports.getUsers = async (req, res) => {
    const users = await User.find().select('-password');
    res.json(users);
};

// Chi tiết người dùng
exports.getUser = async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    res.json(user);
};

// Cập nhật người dùng
exports.updateUser = async (req, res) => {
    try {
        const data = req.body;
        if (data.password) {
            data.password = await bcrypt.hash(data.password, 10);
        }

        const user = await User.findByIdAndUpdate(req.params.id, data, { new: true }).select('-password');
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

        res.json({ message: 'Cập nhật thành công', user });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi cập nhật', error: err.message });
    }
};

// Khóa / mở khóa
exports.toggleLock = async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    user.isLocked = !user.isLocked;
    await user.save();
    res.json({ locked: user.isLocked, message: user.isLocked ? 'Tài khoản đã bị khóa' : 'Tài khoản đã được mở khóa' });
};

// Lấy profile
exports.getProfile = async (req, res) => {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
};
