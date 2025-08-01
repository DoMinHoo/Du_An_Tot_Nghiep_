const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/category.controller");

// Route để lấy tất cả danh mục (chưa bị xóa)
router.get("/", categoryController.getAllCategories);

// Route để lấy danh mục đã xóa mềm
router.get("/deleted", categoryController.getDeletedCategories);

// Route để lấy danh mục con
router.get("/all/with-children", categoryController.getCategoriesWithChildren);

// Route để lấy category ID theo slug
router.get("/slug/:slug", categoryController.getCategoryIdBySlug);

// Route để lấy sản phẩm cho trang danh mục
router.get("/products", categoryController.getProductsForCategoryPage);

// Route để lấy danh mục theo ID
router.get("/:id", categoryController.getCategoryById);

// Route để tạo danh mục mới
router.post("/", categoryController.createCategory);

// Route để cập nhật danh mục
router.put("/:id", categoryController.updateCategory);

// Route để xóa mềm danh mục
router.delete("/:id", categoryController.softDeleteCategory);

// Route để khôi phục danh mục
router.post("/restore/:id", categoryController.restoreCategory);

// Route để xóa vĩnh viễn danh mục
router.delete("/permanent/:id", categoryController.hardDeleteCategory);

module.exports = router;