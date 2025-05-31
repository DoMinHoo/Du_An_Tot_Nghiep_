// utils/slugify.js
module.exports = function slugify(str) {
    return str
        .toLowerCase()
        .trim()
        .replace(/[\s\W-]+/g, '-') // biến thành định dạng-url
        .replace(/^-+|-+$/g, '');  // loại bỏ dấu gạch ở đầu/cuối
};
