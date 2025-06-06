const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/banners'); // thư mục lưu
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname); // ví dụ: .png
        const fileName = Date.now() + '-image' + ext;
        cb(null, fileName);
    },
});

const upload = multer({ storage });
module.exports = upload;
