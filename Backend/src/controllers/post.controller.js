const Post = require("../models/post.model");
const slugify = require("slugify");

// [POST] /api/posts
exports.createPost = async (req, res) => {
  try {
    const { title, content, coverImage, tags, authorId, published } = req.body;

    const slug = slugify(title, { lower: true });

    const existing = await Post.findOne({ slug });
    if (existing) return res.status(400).json({ message: "Slug đã tồn tại" });

    const post = new Post({
      title,
      slug,
      content,
      coverImage,
      tags,
      authorId,
      published,
    });

    await post.save();
    res.status(201).json({ message: "Tạo bài viết thành công", post });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// [GET] /api/posts
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate("authorId", "name email");
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// [GET] /api/posts/:slug
exports.getPostBySlug = async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug }).populate(
      "authorId",
      "name email"
    );
    if (!post)
      return res.status(404).json({ message: "Không tìm thấy bài viết" });

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// [PUT] /api/posts/:id
exports.updatePost = async (req, res) => {
  try {
    const { title, content, coverImage, tags, published } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post)
      return res.status(404).json({ message: "Không tìm thấy bài viết" });

    if (title) {
      post.title = title;
      post.slug = slugify(title, { lower: true });
    }

    if (content) post.content = content;
    if (coverImage) post.coverImage = coverImage;
    if (tags) post.tags = tags;
    if (typeof published === "boolean") post.published = published;

    await post.save();
    res.json({ message: "Cập nhật thành công", post });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// [DELETE] /api/posts/:id
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post)
      return res.status(404).json({ message: "Không tìm thấy bài viết" });

    res.json({ message: "Xoá thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post)
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
