const Category = require("../models/category.model");
const Product = require("../models/products.model");
const ProductVariation = require("../models/product_variations.model"); 
const Material = require("../models/material.model");
const {
  createCategorySchema,
  updateCategorySchema,
} = require("../validators/categoties.validate");
const slugify = require("../untils/slugify");
const mongoose = require("mongoose");

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

// GET tất cả danh mục (chỉ lấy các danh mục chưa bị xóa)
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isDeleted: false }).populate("parentId", "name");
    res.json(categories);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách danh mục:", err);
    res.status(500).json({ message: "Lỗi khi lấy danh sách danh mục" });
  }
};

// GET danh mục đã xóa mềm
const getDeletedCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isDeleted: true }).populate("parentId", "name");
    res.json(categories);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách danh mục đã xóa:", err);
    res.status(500).json({ message: "Lỗi khi lấy danh sách danh mục đã xóa" });
  }
};

// GET danh mục theo ID
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, isDeleted: false }).populate(
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

  try {
    // Kiểm tra trùng slug với danh mục đang hoạt động
    const activeExists = await Category.findOne({ slug, isDeleted: false });
    if (activeExists) {
      return res.status(400).json({ message: "Tên danh mục đã tồn tại" });
    }

    // Kiểm tra trùng slug với danh mục đã xóa mềm
    const deletedExists = await Category.findOne({ slug, isDeleted: true });
    if (deletedExists) {
      return res.status(400).json({ message: "Đã tồn tại danh mục đã xóa mềm với tên này" });
    }

    const newCategory = new Category({ name, description, parentId, slug, isDeleted: false });
    const saved = await newCategory.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("Lỗi khi tạo danh mục:", err);
    if (err.code === 11000 && err.keyPattern.slug) {
      return res.status(400).json({ message: "Slug danh mục đã tồn tại trong cơ sở dữ liệu" });
    }
    res.status(500).json({ message: "Lỗi khi tạo danh mục" });
  }
};

// PUT: Cập nhật danh mục
const updateCategory = async (req, res) => {
  const { error } = updateCategorySchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { name, parentId } = req.body;

  try {
    const category = await Category.findOne({ _id: req.params.id, isDeleted: false });
    if (!category)
      return res.status(404).json({ message: "Không tìm thấy danh mục" });

    if (name && name !== category.name) {
      const exists = await Category.findOne({ name, isDeleted: false });
      if (exists)
        return res.status(400).json({ message: "Tên danh mục đã tồn tại" });
    }

    if (parentId && parentId === req.params.id) {
      return res
        .status(400)
        .json({ message: "parentId không được là chính danh mục" });
    }

    if (parentId && !(await Category.findOne({ _id: parentId, isDeleted: false }))) {
      return res.status(400).json({ message: "parentId không tồn tại" });
    }

    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      { ...req.body, slug: name ? slugify(name) : category.slug },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    console.error("Lỗi khi cập nhật danh mục:", err);
    res.status(500).json({ message: "Cập nhật danh mục thất bại" });
  }
};

// DELETE: Xóa mềm danh mục
const softDeleteCategory = async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, isDeleted: false });
    if (!category)
      return res.status(404).json({ message: "Không tìm thấy danh mục" });

    // Kiểm tra danh mục con
    const hasChildren = await Category.findOne({ parentId: category._id, isDeleted: false });
    if (hasChildren) {
      return res
        .status(400)
        .json({ message: "Không thể xóa danh mục có danh mục con" });
    }

    // Kiểm tra sản phẩm liên quan
    const hasProducts = await Product.findOne({ 
      categoryId: category._id, 
      isDeleted: false 
    });
    if (hasProducts) {
      return res
        .status(400)
        .json({ message: "Không thể xóa danh mục vì còn sản phẩm liên quan đang hoạt động" });
    }

    // Đánh dấu xóa mềm
    category.isDeleted = true;
    await category.save();

    res.json({ message: "Xóa mềm danh mục thành công" });
  } catch (err) {
    console.error("Lỗi khi xóa mềm danh mục:", err);
    res.status(500).json({ message: "Xóa mềm danh mục thất bại" });
  }
};

// POST: Khôi phục danh mục
const restoreCategory = async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, isDeleted: true });
    if (!category)
      return res.status(404).json({ message: "Không tìm thấy danh mục đã xóa" });

    // Kiểm tra trùng tên hoặc slug
    const exists = await Category.findOne({
      $or: [{ name: category.name }, { slug: category.slug }],
      isDeleted: false,
    });
    if (exists) {
      return res.status(400).json({
        message: "Không thể khôi phục vì tên hoặc slug đã tồn tại trong danh mục đang hoạt động",
      });
    }

    // Kiểm tra parentId (nếu có) có hợp lệ không
    if (category.parentId && !(await Category.findOne({ _id: category.parentId, isDeleted: false }))) {
      return res.status(400).json({ message: "Danh mục cha không tồn tại hoặc đã bị xóa" });
    }

    // Khôi phục danh mục
    category.isDeleted = false;
    await category.save();

    res.json({ message: "Khôi phục danh mục thành công", category });
  } catch (err) {
    console.error("Lỗi khi khôi phục danh mục:", err);
    res.status(500).json({ message: "Khôi phục danh mục thất bại" });
  }
};

// DELETE: Xóa vĩnh viễn danh mục
const hardDeleteCategory = async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, isDeleted: true });
    if (!category)
      return res.status(404).json({ message: "Không tìm thấy danh mục đã xóa" });

    // Kiểm tra danh mục con (kể cả đã xóa mềm)
    const hasChildren = await Category.findOne({ parentId: category._id });
    if (hasChildren) {
      return res
        .status(400)
        .json({ message: "Không thể xóa vĩnh viễn danh mục có danh mục con" });
    }

    // Kiểm tra sản phẩm liên quan (kể cả đã xóa mềm)
    const hasProducts = await Product.findOne({ categoryId: category._id });
    if (hasProducts) {
      return res
        .status(400)
        .json({ message: "Không thể xóa vĩnh viễn danh mục có sản phẩm liên quan" });
    }

    // Xóa vĩnh viễn
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: "Xóa vĩnh viễn danh mục thành công" });
  } catch (err) {
    console.error("Lỗi khi xóa vĩnh viễn danh mục:", err);
    res.status(500).json({ message: "Xóa vĩnh viễn danh mục thất bại" });
  }
};

// Lấy danh mục kèm danh mục con (chỉ lấy các danh mục chưa bị xóa)
const getCategoriesWithChildren = async (req, res) => {
  try {
    const parents = await Category.find({ parentId: null, isDeleted: false });

    const result = await Promise.all(
      parents.map(async (parent) => {
        const children = await Category.find({ parentId: parent._id, isDeleted: false });

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
    const category = await Category.findOne({ slug, isDeleted: false }).select("_id name slug");

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

// Hàm lấy sản phẩm cho trang danh mục (giữ nguyên)
const getProductsForCategoryPage = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12, // Đã sửa từ 10 thành 12
      sort = "created_at",
      category,
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

    if (minPrice || maxPrice) {
      const priceConditions = [];
      if (minPrice) {
        priceConditions.push({
          $or: [
            { salePrice: { $ne: null, $gte: parseFloat(minPrice) } },
            { salePrice: null, finalPrice: { $gte: parseFloat(minPrice) } },
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

    if (color) {
      variationFilters.colorName = { $regex: new RegExp(color, "i") };
    }

    if (size) {
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

    if (flashSaleOnly === "true") {
      const now = new Date();
      query.flashSale_discountedPrice = { $gt: 0 };
      query.flashSale_start = { $lte: now };
      query.flashSale_end = { $gte: now };
    }

    const sortOption = {};
    if (filter === "hot") {
      sortOption.totalPurchased = -1;
    } else if (filter === "new") {
      sortOption.createdAt = -1;
    } else {
      switch (sort) {
        case "price_asc":
          sortOption.salePrice = 1;
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

    const safePage = parseInt(page) || 1;
    const safeLimit = parseInt(limit) || 12;
    const skipCount = (safePage - 1) * safeLimit;

    const products = await Product.find(query)
      .populate("categoryId")
      .sort(sortOption)
      .skip(skipCount)
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
        page: safePage,
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

module.exports = {
  getAllCategories,
  getDeletedCategories, // Thêm hàm lấy danh mục đã xóa
  getCategoryById,
  createCategory,
  updateCategory,
  softDeleteCategory, // Thay deleteCategory bằng softDeleteCategory
  restoreCategory, // Thêm hàm khôi phục
  hardDeleteCategory, // Thêm hàm xóa vĩnh viễn
  getCategoriesWithChildren,
  getCategoryIdBySlug,
  getProductsForCategoryPage,
};