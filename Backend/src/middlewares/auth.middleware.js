const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');

dotenv.config();
// Hàm tạo token JWT cho người dùng
const generateToken = (user) => {
    return jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );
};
 // Middleware để bảo vệ các route cần xác thực và phân quyền
const protect = (roles = []) => {
    return (req, res, next) => {
        const authHeader = req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Không tìm thấy token hoặc định dạng sai (Bearer <token>)'
            });
        }

        const token = authHeader.replace('Bearer ', '');
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = {
                userId: decoded.userId || decoded.id,
                role: decoded.role
            };

            if (!req.user.userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Token không chứa userId'
                });
            }

            let allowedRoles = Array.isArray(roles) ? roles : [roles];
            if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Không có quyền truy cập'
                });
            }

            next();
        } catch (err) {
            res.status(401).json({
                success: false,
                message: 'Token không hợp lệ hoặc đã hết hạn'
            });
        }
    };
};
// Middleware để xác thực token
const verifyToken = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Không tìm thấy token hoặc định dạng sai (Bearer <token>)'
        });
    }

    const token = authHeader.replace('Bearer ', '');
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
            userId: decoded.userId || decoded.id,
            role: decoded.role
        };
        next();
    } catch (err) {
        res.status(401).json({
            success: false,
            message: 'Token không hợp lệ hoặc đã hết hạn'
        });
    }
};
 // Middleware để bảo vệ các route cần xác thực
const optionalProtect = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = {
                userId: decoded.userId || decoded.id,
                role: decoded.role
            };
        } catch (err) {
            // Token không hợp lệ, chuyển sang guest
            req.guest = { guestId: uuidv4() };
        }
    } else {
        // Không có token, tạo guestId
        req.guest = { guestId: uuidv4() };
    }
    next();
};

module.exports = { generateToken, protect, verifyToken, optionalProtect }; //