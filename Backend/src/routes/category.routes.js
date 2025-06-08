const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { getCategoriesWithChildren } = require('../controllers/category.controller');


router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);
router.post('/', categoryController.createCategory);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);
router.get('/all/with-children', getCategoriesWithChildren); // Lấy danh mục cha và con



module.exports = router;
