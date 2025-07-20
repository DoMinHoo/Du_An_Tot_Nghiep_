// src/routes/category.routes.js
const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/category.controller"); // Sửa tên biến này cho đúng

// Route để lấy tất cả danh mục (có thể dùng ở admin hoặc menu)
router.get("/", categoryController.getAllCategories);

// Route để lấy danh mục con (có thể dùng ở menu)
router.get("/all/with-children", categoryController.getCategoriesWithChildren);

// Route để lấy category ID theo slug (cho trang danh mục)
router.get("/slug/:slug", categoryController.getCategoryIdBySlug);

// ROUTE MỚI ĐỂ LẤY SẢN PHẨM CÓ BỘ LỌC CHO TRANG DANH MỤC
// Ví dụ: GET /api/categories/products?category=abc&minPrice=...
router.get("/products", categoryController.getProductsForCategoryPage);

// Các routes CRUD cho danh mục (giữ nguyên)
router.get("/:id", categoryController.getCategoryById);
router.post("/", categoryController.createCategory);
router.put("/:id", categoryController.updateCategory);
router.delete("/:id", categoryController.deleteCategory);

module.exports = router;
