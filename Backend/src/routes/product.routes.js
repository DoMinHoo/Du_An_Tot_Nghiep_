const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const upload = require('../middlewares/upload');

// Lấy danh sách sản phẩm với bộ lọc và phân trang
router.get('/', productController.getProducts);

// Lấy chi tiết sản phẩm theo ID
router.get('/:id', productController.getProductById);

// Tạo sản phẩm mới (admin)
router.post('/', upload.array('images', 20), productController.createProduct);

// Cập nhật sản phẩm (admin)
router.put('/:id', upload.array('images', 20), productController.updateProduct);

// Xóa mềm sản phẩm (admin)
router.delete('/:id', productController.softDeleteProduct);

// Lấy danh sách chất liệu của sản phẩm theo ID
router.get("/:productId/materials", productController.getMaterialsByProductId);

// Tìm kiếm sản phẩm theo từ khóa (tương đối và tuyệt đối)
router.get('/search/keyword', productController.searchProducts);

module.exports = router;