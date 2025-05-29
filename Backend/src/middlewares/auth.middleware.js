const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Load biến môi trường từ .env
dotenv.config();

// Hàm tạo JWT token
const generateToken = (user) => {
    return jwt.sign(
        { userId: user._id, role: user.roleId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
};

// Middleware để bảo vệ route bằng token
const protect = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];  // Lấy token từ header Authorization

    if (!token) {
        return res.status(401).json({ message: 'Không có token, không thể xác thực' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;  // Thêm thông tin user vào request object
        next();  // Tiến hành tiếp tục xử lý request
    } catch (err) {
        res.status(401).json({ message: 'Token không hợp lệ' });
    }
};

// Export các hàm ra ngoài
module.exports = { generateToken, protect };
