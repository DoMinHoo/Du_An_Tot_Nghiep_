const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Load biến môi trường từ .env
dotenv.config();

// Hàm tạo JWT token
// Giả sử biến user truyền vào đã có trường user.role là chuỗi "admin" hoặc "user"
// Nếu user.role là roleId, bạn phải JOIN lấy role.name trước khi gọi hàm này!
const generateToken = (user) => {
    return jwt.sign(
        { userId: user._id, role: user.role }, // role: "admin" hoặc "user"
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
};

// Middleware bảo vệ route và phân quyền
// Có thể truyền vào 1 role (chuỗi) hoặc nhiều role (mảng)
const protect = (roles = []) => {
    return (req, res, next) => {
        const token = req.header('Authorization')?.split(' ')[1]; // Lấy token từ header Authorization

        if (!token) {
            return res.status(401).json({ message: 'Không có token, không thể xác thực' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded; // Thêm thông tin user vào request object

            // Nếu roles là string thì chuyển thành mảng cho tiện xử lý
            let allowedRoles = Array.isArray(roles) ? roles : [roles];

            // Nếu truyền roles thì kiểm tra quyền truy cập
            if (
                allowedRoles.length > 0 &&
                !allowedRoles.includes(req.user.role)
            ) {
                return res.status(403).json({ message: 'Không có quyền truy cập' });
            }

            next(); // Tiếp tục xử lý request
        } catch (err) {
            res.status(401).json({ message: 'Token không hợp lệ' });
        }
    };
};
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Không có token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ message: "Token không hợp lệ" });
  }
};
  

// Export các hàm ra ngoài
module.exports = { generateToken, protect, verifyToken };
