const mongoose = require("mongoose");
const Product = require("../models/products.model");
const Category = require("../models/category.model");
const Material = require("../models/material.model");
const ProductVariation = require("../models/product_variations.model");
const path = require("path");

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

// Lấy danh sách sản phẩm với filter + breadcrumb
exports.getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = "created_at",
      category,
      color,
      minPrice,
      maxPrice,
      status = "active",
      flashSaleOnly = false,
      filter,
    } = req.query;

    const query = { isDeleted: false };

    if (status) query.status = status;
    if (category) query.categoryId = category;
    if (color) query.color = color;


    // ✅ Lọc theo salePrice (giá đang bán) thay vì giá gốc
    if (minPrice || maxPrice) {
      query.salePrice = {};
      if (minPrice) query.salePrice.$gte = parseFloat(minPrice);
      if (maxPrice) query.salePrice.$lte = parseFloat(maxPrice);
    }

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
      sortOption.totalPurchased = -1; // bán chạy nhất
    } else if (filter === "new") {
      sortOption.createdAt = -1; // mới nhất theo timestamp
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

    const safeLimit = Math.min(parseInt(limit), 100);
    const products = await Product.find(query)
      .populate("categoryId")
      .sort(sortOption)
      .skip((page - 1) * safeLimit)
      .limit(safeLimit);

    const total = await Product.countDocuments(query);

    // ✅ Breadcrumb theo danh mục
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
    res.status(500).json({ success: false, message: err.message });
  }
};


// Lấy chi tiết sản phẩm theo ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).populate("categoryId");
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    res.json({
      success: true,
      data: {
        ...product._doc,
        isAvailable: product.stock_quantity > 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Tạo sản phẩm
exports.createProduct = async (req, res) => {
  try {
    const uploadedImages = Array.isArray(req.files)
      ? req.files.map((file) => `/uploads/banners/${path.basename(file.path)}`)
      : [];

    const body = req.body || {};
    const bodyImages = Array.isArray(body.image)
      ? body.image
      : body.image
        ? [body.image]
        : [];

    const images = [...uploadedImages, ...bodyImages];

    const productData = {
      ...body,
      image: images,
      isDeleted: body.isDeleted === "true" || false,
      categoryId: body.categoryId,
    };

    const product = new Product(productData);
    await product.save();

    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Cập nhật sản phẩm
exports.updateProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const uploadedImages = req.files
      ? req.files.map((file) => `/uploads/banners/${path.basename(file.path)}`)
      : [];
    const body = req.body || {};
    const bodyImages = Array.isArray(body.image)
      ? body.image
      : body.image
        ? [body.image]
        : [];

    const finalImages =
      uploadedImages.length > 0
        ? uploadedImages
        : bodyImages.length > 0
          ? bodyImages
          : product.image;

    const productData = {
      ...body,
      image: finalImages,
      isDeleted: body.isDeleted === "true" || false,
      categoryId: body.categoryId,
    };

    const updated = await Product.findByIdAndUpdate(id, productData, {
      new: true,
    });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Xoá mềm sản phẩm
exports.softDeleteProduct = async (req, res) => {
  try {
    const updated = await Product.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    res.json({ success: true, message: "Product soft-deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Cập nhật tồn kho
exports.updateStock = async (req, res) => {
  try {
    const { stock_quantity } = req.body;
    const productId = req.params.id;

    if (typeof stock_quantity !== "number" || stock_quantity < 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid stock quantity" });
    }

    const updated = await Product.findOneAndUpdate(
      { _id: productId, isDeleted: false },
      { stock_quantity },
      { new: true }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// Lấy danh sách chất liệu của sản phẩm theo ID
exports.getMaterialsByProductId = async (req, res) => {
  try {
    const { productId } = req.params;

    // 1. Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "ID sản phẩm không hợp lệ" });
    }

    // 2. Lấy tất cả variations của productId và populate material
    const variations = await ProductVariation.find({ productId })
      .populate("material", "name") // chỉ lấy field 'name' trong material
      .lean();

    // 3. Trích xuất danh sách tên chất liệu
    const materialNames = variations
      .map((v) => v.material?.name)
      .filter(Boolean); // loại bỏ null/undefined

    // 4. Lọc trùng và ghép thành chuỗi
    const uniqueMaterials = [...new Set(materialNames)];
    const materialString = uniqueMaterials.join(", ");

    return res.json({ success: true, materials: materialString });
  } catch (err) {
    console.error("Lỗi khi lấy chất liệu:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Tìm kiếm sản phẩm theo từ khóa
exports.searchProducts = async (req, res) => {
  try {
    const { keyword, strict } = req.query;

    if (!keyword || keyword.trim() === '') {
      return res.status(400).json({ message: 'Thiếu từ khóa tìm kiếm' });
    }

    const query = strict === 'true'
      ? { name: keyword.trim(), isDeleted: false, status: 'active' } // tìm chính xác
      : {
          name: { $regex: keyword.trim(), $options: 'i' },
          isDeleted: false,
          status: 'active'
        }; // tìm tương đối (không phân biệt hoa thường)

    const products = await Product.find(query);
    res.status(200).json(products);
  } catch (err) {
    console.error('Lỗi tìm kiếm:', err);
    res.status(500).json({ message: 'Lỗi server khi tìm kiếm sản phẩm' });
  }
};
