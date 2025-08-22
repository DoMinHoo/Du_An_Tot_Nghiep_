const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

// 🔐 Tạo JWT token
const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
};

// 🔒 Middleware bắt buộc xác thực
const protect = (roles = []) => {
  return (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy token hoặc định dạng sai (Bearer <token>)',
      });
    }

    const token = authHeader.replace('Bearer ', '');
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        userId: decoded.userId || null, // Không bắt buộc phải có userId
        role: decoded.role,
      };

      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền truy cập',
        });
      }

      next();
    } catch (err) {
      res.status(401).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn',
      });
    }
  };
};

// ✅ Middleware xác thực nếu có (không bắt buộc)
const optionalProtect = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        userId: decoded.userId || null,
        role: decoded.role,
      };
    } catch (err) {
      console.warn('⚠️ Token không hợp lệ, tiếp tục không xác thực');
    }
  }
  next();
};

// ✅ Middleware kiểm tra token (không kiểm tra role)
const verifyToken = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Không tìm thấy token hoặc định dạng sai (Bearer <token>)',
    });
  }

  const token = authHeader.replace('Bearer ', '');
  console.log("💡 TOKEN NHẬN ĐƯỢC:", token);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      userId: decoded.userId || null,
      role: decoded.role,
    };
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn',
    });
  }
};

module.exports = {
  generateToken,
  protect,
  optionalProtect,
  verifyToken,

};
