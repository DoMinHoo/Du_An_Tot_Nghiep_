    const User = require('../models/user.model');
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');

    // Đăng ký người dùng
    exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hash = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hash });

        res.status(201).json({
        message: 'Tạo tài khoản thành công',
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
        });
    } catch (err) {
        res.status(400).json({ message: 'Lỗi khi tạo tài khoản', error: err.message });
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
