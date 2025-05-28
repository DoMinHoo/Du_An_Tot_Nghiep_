const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');

router.get('/', categoryController.getAll); // Quản lý danh muc
router.get('/tree', categoryController.getTree); //Lấy cây danh mục phân cấp
router.post('/', categoryController.create); // Tạo danh muc
router.put('/:id', categoryController.update); // Cập nhật danh muc
router.delete('/:id', categoryController.remove); // Xoa danh muc

module.exports = router;
