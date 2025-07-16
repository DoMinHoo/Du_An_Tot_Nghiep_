const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Tạo thư mục nếu chưa có (tùy chọn)
const fs = require('fs');
const uploadDir = path.join(__dirname, '../uploads/banners');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// Endpoint upload
router.post("/", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const imageUrl = `/uploads/banners/${req.file.filename}`;
  res.status(200).json({ url: imageUrl });
});


module.exports = router;
