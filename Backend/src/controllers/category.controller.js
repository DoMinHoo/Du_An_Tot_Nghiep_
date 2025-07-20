// src/controllers/category.controller.js

const Category = require("../models/category.model");
const {
  createCategorySchema,
  updateCategorySchema,
} = require("../validators/categoties.validate");
const slugify = require("../untils/slugify");
// THÊM CÁC IMPORTS SAU CHO LOGIC LỌC SẢN PHẨM
const mongoose = require("mongoose");
const Product = require("../models/products.model"); // Đảm bảo đã import model Product
const Material = require("../models/material.model"); // Đảm bảo đã import model Material
const ProductVariation = require("../models/product_variations.model"); // Đảm bảo đã import model ProductVariation
// const path = require("path"); // Không cần thiết ở đây, nếu không có logic xử lý file

// Hàm đệ quy xây dựng breadcrumb từ categoryId
const buildCategoryBreadcrumb = async (categoryId) => {
  const breadcrumb = [];
  let current = await Category.findById(categoryId).select("name parentId");
  while (current) {
    breadcrumb.unshift(current.name);
    if (!current.parentId) break;
    current = await Category.findById(current.parentId).select("name parentId");
  }
  return ["Home", ...breadcrumb];
};

// GET tất cả danh mục
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate("parentId", "name");
    res.json(categories);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách danh mục:", err);
    res.status(500).json({ message: "Lỗi khi lấy danh sách danh mục" });
  }
};

// GET danh mục theo ID
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate(
      "parentId",
      "name"
    );
    if (!category)
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    res.json(category);
  } catch (err) {
    console.error("Lỗi khi lấy danh mục theo ID:", err);
    res.status(500).json({ message: "Lỗi khi lấy danh mục" });
  }
};

// POST: Tạo mới danh mục
const createCategory = async (req, res) => {
  const { error } = createCategorySchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });
  const { name, description, parentId } = req.body;
  const slug = slugify(name);

  const exists = await Category.findOne({ slug });
  if (exists)
    return res.status(400).json({ message: "Tên danh mục đã tồn tại" });

  const newCategory = new Category({ name, description, parentId, slug });
  try {
    const saved = await newCategory.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("Lỗi khi tạo danh mục:", err);
    res.status(500).json({ message: "Lỗi khi tạo danh mục" });
  }
};

// PUT: Cập nhật danh mục
const updateCategory = async (req, res) => {
  const { error } = updateCategorySchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { name, parentId } = req.body;

  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Không tìm thấy danh mục" });

    if (name && name !== category.name) {
      const exists = await Category.findOne({ name });
      if (exists)
        return res.status(400).json({ message: "Tên danh mục đã tồn tại" });
    }

    if (parentId && parentId === req.params.id) {
      return res
        .status(400)
        .json({ message: "parentId không được là chính danh mục" });
    }

    if (parentId && !(await Category.findById(parentId))) {
      return res.status(400).json({ message: "parentId không tồn tại" });
    }

    const updated = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    console.error("Lỗi khi cập nhật danh mục:", err);
    res.status(500).json({ message: "Cập nhật danh mục thất bại" });
  }
};

// DELETE danh mục
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Không tìm thấy danh mục" });

    const hasChildren = await Category.findOne({ parentId: category._id });
    if (hasChildren) {
      return res
        .status(400)
        .json({ message: "Không thể xoá danh mục có danh mục con" });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: "Xoá danh mục thành công" });
  } catch (err) {
    console.error("Lỗi khi xóa danh mục:", err);
    res.status(500).json({ message: "Xoá danh mục thất bại" });
  }
};

// Lấy danh mục kèm danh mục con
const getCategoriesWithChildren = async (req, res) => {
  try {
    const parents = await Category.find({ parentId: null });

    const result = await Promise.all(
      parents.map(async (parent) => {
        const children = await Category.find({ parentId: parent._id });

        return {
          _id: parent._id,
          name: parent.name,
          description: parent.description,
          slug: parent.slug,
          children: children.map((child) => ({
            _id: child._id,
            name: child.name,
            description: child.description,
            slug: child.slug,
          })),
        };
      })
    );

    res.json(result);
  } catch (err) {
    console.error("Lỗi chi tiết khi lấy danh mục con:", err);
    res
      .status(500)
      .json({ message: "Lỗi khi lấy danh mục", error: err.message });
  }
};

// Lấy Category ID theo Slug
const getCategoryIdBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const category = await Category.findOne({ slug }).select("_id name slug");

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Danh mục không tồn tại" });
    }

    res.json({ success: true, categoryId: category._id, category });
  } catch (error) {
    console.error("Lỗi khi lấy categoryId by slug:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
};

// =========================================================================
// HÀM MỚI ĐỂ LẤY SẢN PHẨM CÓ LỌC BIẾN THỂ CHO TRANG DANH MỤC
// =========================================================================
const getProductsForCategoryPage = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = "created_at",
      category, // category ID
      color,
      size,
      material,
      minPrice,
      maxPrice,
      status = "active",
      flashSaleOnly = false,
      filter,
    } = req.query;

    const query = { isDeleted: false };

    if (status) query.status = status;
    if (category) query.categoryId = category;

    let productIdsFromVariations = null;
    const variationFilters = {};

    // 1. Lọc theo giá (từ ProductVariation)
    if (minPrice || maxPrice) {
      const priceConditions = [];
      if (minPrice) {
        priceConditions.push({
          $or: [
            { salePrice: { $ne: null, $gte: parseFloat(minPrice) } }, // Ưu tiên salePrice của biến thể nếu có
            { salePrice: null, finalPrice: { $gte: parseFloat(minPrice) } }, // Nếu salePrice null, dùng finalPrice
          ],
        });
      }
      if (maxPrice) {
        priceConditions.push({
          $or: [
            { salePrice: { $ne: null, $lte: parseFloat(maxPrice) } },
            { salePrice: null, finalPrice: { $lte: parseFloat(maxPrice) } },
          ],
        });
      }
      if (priceConditions.length > 0) {
        variationFilters.$and = variationFilters.$and
          ? [...variationFilters.$and, ...priceConditions]
          : priceConditions;
      }
    }

    // 2. Lọc theo màu sắc (colorName từ ProductVariation)
    if (color) {
      variationFilters.colorName = { $regex: new RegExp(color, "i") };
    }

    // 3. Lọc theo kích thước (dimensions từ ProductVariation)
    if (size) {
      // Đây là ví dụ, bạn cần điều chỉnh regex phù hợp với định dạng 'dimensions' của bạn
      // và các giá trị 'size' từ frontend ('nhỏ', 'vừa', 'lớn' hoặc kích thước cụ thể)
      if (size === "nhỏ") {
        variationFilters.dimensions = {
          $regex: /^((\d{1,2}|1\d{1,2}|200)x){2,2}\d{1,2} cm/i,
        };
      } else if (size === "vừa") {
        variationFilters.dimensions = {
          $regex: /^((\d{1,2}|1\d{1,2}|2\d{1,2}|300)x){2,2}\d{1,2} cm/i,
        };
      } else if (size === "lớn") {
        variationFilters.dimensions = {
          $regex:
            /^((\d{1,2}|1\d{1,2}|2\d{1,2}|3\d{1,2}|4\d{1,2}|500)x){2,2}\d{1,2} cm/i,
        };
      } else {
        variationFilters.dimensions = { $regex: new RegExp(size, "i") };
      }
    }

    // 4. Lọc theo chất liệu (material ObjectId từ ProductVariation)
    if (material) {
      if (mongoose.Types.ObjectId.isValid(material)) {
        variationFilters.material = material;
      } else {
        const materialDoc = await Material.findOne({
          name: { $regex: new RegExp(material, "i") },
        });
        if (materialDoc) {
          variationFilters.material = materialDoc._id;
        } else {
          // Nếu không tìm thấy chất liệu, trả về mảng rỗng để tránh lỗi và báo hiệu không có sản phẩm
          return res.json({
            success: true,
            data: [],
            breadcrumb: ["Home"],
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: 0,
              totalPages: 0,
            },
          });
        }
      }
    }

    if (Object.keys(variationFilters).length > 0) {
      const matchingVariations = await ProductVariation.find(
        variationFilters
      ).select("productId");
      productIdsFromVariations = new Set(
        matchingVariations.map((v) => v.productId.toString())
      );

      if (productIdsFromVariations.size === 0) {
        return res.json({
          success: true,
          data: [],
          breadcrumb: ["Home"],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            totalPages: 0,
          },
        });
      }
      query._id = { $in: Array.from(productIdsFromVariations) };
    }
    // --- KẾT THÚC LOGIC LỌC THEO BIẾN THỂ VÀ GIÁ CỦA BIẾN THỂ ---

    // ✅ Lọc Flash Sale nếu cần
    if (flashSaleOnly === "true") {
      const now = new Date();
      query.flashSale_discountedPrice = { $gt: 0 };
      query.flashSale_start = { $lte: now };
      query.flashSale_end = { $gte: now };
    }

    // ✅ Ưu tiên filter trước nếu có
    const sortOption = {};
    if (filter === "hot") {
      sortOption.totalPurchased = -1;
    } else if (filter === "new") {
      sortOption.createdAt = -1;
    } else {
      switch (sort) {
        case "price_asc":
          sortOption.salePrice = 1; // Giả định Product có salePrice đại diện để sắp xếp
          break;
        case "price_desc":
          sortOption.salePrice = -1;
          break;
        case "bestseller":
          sortOption.totalPurchased = -1;
          break;
        case "created_at":
        default:
          sortOption.createdAt = -1;
          break;
      }
    }

    const safeLimit = Math.min(parseInt(limit), 100);
    const products = await Product.find(query)
      .populate("categoryId")
      .sort(sortOption)
      .skip((page - 1) * safeLimit)
      .limit(safeLimit);

    const total = await Product.countDocuments(query);

    let breadcrumb = ["Home"];
    if (category) {
      try {
        breadcrumb = await buildCategoryBreadcrumb(category);
      } catch (e) {
        console.warn("Không thể tạo breadcrumb:", e.message);
      }
    }

    res.json({
      success: true,
      data: products,
      breadcrumb,
      pagination: {
        page: parseInt(page),
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    });
  } catch (err) {
    console.error("Error in getProductsForCategoryPage:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Cập nhật module.exports để bao gồm hàm mới
module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoriesWithChildren,
  getCategoryIdBySlug,
  getProductsForCategoryPage, // EXPORT HÀM MỚI NÀY
};
