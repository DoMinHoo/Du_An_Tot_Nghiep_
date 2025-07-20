const express = require("express");
const router = express.Router();
const postController = require("../controllers/post.controller");

// Các route chính
router.post("/", postController.createPost); // Tạo bài viết
router.get("/", postController.getAllPosts); // Lấy tất cả bài viết
router.get("/:slug", postController.getPostBySlug); // Lấy bài viết theo slug
router.put("/:id", postController.updatePost); // Cập nhật bài viết
router.delete("/:id", postController.deletePost); // Xoá bài viết
router.get('/id/:id', postController.getPostById); // GET /api/posts/id/:id
router.get('/:id', postController.getPostById); // Thêm dòng này ở cuối, sau tất cả các route cụ thể



module.exports = router;
