    const multer = require('multer');
    const path = require('path');

    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'uploads/');
        },
        filename: function (req, file, cb) {
            const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, `${unique}-${file.originalname}`);
        }
    });

    const fileFilter = (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        cb(null, allowedTypes.includes(file.mimetype));
    };

    module.exports = multer({ storage, fileFilter });
