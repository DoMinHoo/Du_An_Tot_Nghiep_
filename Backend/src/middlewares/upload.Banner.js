// middleware/upload.js
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: './uploads/banners',
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = `${Date.now()}-${file.fieldname}${ext}`;
        cb(null, name);
    }
});

const upload = multer({ storage });

module.exports = upload;
