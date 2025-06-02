    const express = require('express');
    const router = express.Router();
    const productController = require('../controllers/product.controller');
    const upload = require('../middlewares/upload');

    // Lấy danh sách sản phẩm với bộ lọc và phân trang
    router.get('/', productController.getProducts);

    // Lấy chi tiết sản phẩm theo ID
    router.get('/:id', productController.getProductById);

    // Tạo sản phẩm mới (admin)
    router.post('/',  upload.array('images', 5), productController.createProduct);

    // Cập nhật sản phẩm (admin)
    router.put('/:id',  upload.array('images', 5), productController.updateProduct);

    // Xóa mềm sản phẩm (admin)
    router.delete('/:id', productController.softDeleteProduct);

    // Cập nhật số lượng tồn kho (admin)
    router.patch('/:id/stock', productController.updateStock);

    module.exports = router;