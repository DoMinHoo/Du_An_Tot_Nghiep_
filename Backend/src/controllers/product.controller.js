const mongoose = require("mongoose");
const Product = require("../models/products.model");
const Category = require("../models/category.model");
const Material = require("../models/material.model");
const ProductVariation = require("../models/product_variations.model");
const Review = require("../models/review.model"); // Thêm dòng này để import Review model
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

// Hàm mới để tính toán rating trung bình và tổng số đánh giá
const getProductRatings = async (productId) => {
  const result = await Review.aggregate([
    {
      $match: {
        product: new mongoose.Types.ObjectId(productId),
        visible: true,
      },
    },
    {
      $group: {
        _id: "$product",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (result.length > 0) {
    return {
      averageRating: parseFloat(result[0].averageRating.toFixed(1)), // Làm tròn 1 chữ số thập phân
      totalReviews: result[0].totalReviews,
    };
  }
  return { averageRating: 0, totalReviews: 0 };
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
      isDeleted, // Thêm tham số isDeleted
    } = req.query;

    const query = {}; // Xử lý tham số isDeleted

    // Xử lý tham số isDeleted
    if (isDeleted !== undefined) {
      query.isDeleted = isDeleted === "true";
    } else {
      query.isDeleted = false; // Mặc định chỉ lấy sản phẩm chưa xóa mềm
    }

    if (status && !query.isDeleted) query.status = status; // Chỉ áp dụng status nếu không lấy sản phẩm đã xóa
    if (category) query.categoryId = category;
    if (color) query.color = color; // Lọc theo salePrice

    // Lọc theo salePrice
    if (minPrice || maxPrice) {
      query.salePrice = {};
      if (minPrice) query.salePrice.$gte = parseFloat(minPrice);
      if (maxPrice) query.salePrice.$lte = parseFloat(maxPrice);
    } // Lọc Flash Sale

    // Lọc Flash Sale
    if (flashSaleOnly === "true") {
      const now = new Date();
      query.flashSale_discountedPrice = { $gt: 0 };
      query.flashSale_start = { $lte: now };
      query.flashSale_end = { $gte: now };
    } // Xử lý sắp xếp

    // Xử lý sắp xếp
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

    const safeLimit = Math.min(parseInt(limit), 100);
    let products = await Product.find(query) // Thay đổi thành `let` để có thể gán lại
      .populate("categoryId")
      .sort(sortOption)
      .skip((page - 1) * safeLimit)
      .limit(safeLimit)
      .lean(); // Thêm .lean() để dễ dàng thêm thuộc tính mới

    const total = await Product.countDocuments(query);

    // Thêm thông tin đánh giá vào từng sản phẩm
    products = await Promise.all(
      products.map(async (product) => {
        const ratings = await getProductRatings(product._id);
        return {
          ...product,
          averageRating: ratings.averageRating,
          totalReviews: ratings.totalReviews,
        };
      })
    ); // Breadcrumb theo danh mục

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
    console.error("Lỗi khi lấy danh sách sản phẩm:", err);
    res
      .status(500)
      .json({
        success: false,
        message: "Lỗi server khi lấy danh sách sản phẩm",
      });
  }
};

// Lấy chi tiết sản phẩm theo ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isDeleted: false,
    })
      .populate("categoryId")
      .lean(); // Thêm .lean()

    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    // Lấy thông tin đánh giá cho sản phẩm chi tiết
    const ratings = await getProductRatings(product._id);

    res.json({
      success: true,
      data: {
        ...product, // Sử dụng product trực tiếp vì đã có .lean()
        isAvailable: product.stock_quantity > 0,
        averageRating: ratings.averageRating, // Thêm averageRating
        totalReviews: ratings.totalReviews, // Thêm totalReviews
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

// Xóa mềm sản phẩm (Soft Delete)
exports.softDeleteProduct = async (req, res) => {
  try {
    const productId = req.params.id; // 1. Kiểm tra ID sản phẩm hợp lệ

    // 1. Kiểm tra ID sản phẩm hợp lệ
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "ID sản phẩm không hợp lệ",
      });
    } // 2. Kiểm tra sản phẩm có tồn tại và chưa bị xóa mềm

    // 2. Kiểm tra sản phẩm có tồn tại và chưa bị xóa mềm
    const product = await Product.findOne({
      _id: productId,
      isDeleted: false,
    });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không tồn tại hoặc đã bị xóa",
      });
    } // 3. Kiểm tra xem sản phẩm có biến thể không

    // 3. Kiểm tra xem sản phẩm có biến thể không
    const variations = await ProductVariation.find({
      productId,
      isDeleted: false,
    });
    if (variations.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Không thể xóa sản phẩm vì vẫn còn biến thể tồn tại",
      });
    } // 4. Thực hiện xóa mềm sản phẩm

    // 4. Thực hiện xóa mềm sản phẩm
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { isDeleted: true, updatedAt: new Date() },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Xóa mềm sản phẩm thành công",
      data: updatedProduct,
    });
  } catch (err) {
    console.error("Lỗi khi xóa mềm sản phẩm:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa mềm sản phẩm",
    });
  }
};

// Xóa vĩnh viễn sản phẩm (Hard Delete)
exports.hardDeleteProduct = async (req, res) => {
  try {
    const productId = req.params.id; // 1. Kiểm tra ID sản phẩm hợp lệ

    // 1. Kiểm tra ID sản phẩm hợp lệ
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "ID sản phẩm không hợp lệ",
      });
    } // 2. Kiểm tra sản phẩm có tồn tại

    // 2. Kiểm tra sản phẩm có tồn tại
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không tồn tại",
      });
    } // 3. Kiểm tra xem sản phẩm có biến thể không

    // 3. Kiểm tra xem sản phẩm có biến thể không
    const variations = await ProductVariation.find({
      productId,
      isDeleted: false,
    });
    if (variations.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Không thể xóa vĩnh viễn sản phẩm vì vẫn còn biến thể tồn tại",
      });
    } // 4. Thực hiện xóa vĩnh viễn sản phẩm

    // 4. Thực hiện xóa vĩnh viễn sản phẩm
    await Product.findByIdAndDelete(productId);

    return res.status(200).json({
      success: true,
      message: "Xóa vĩnh viễn sản phẩm thành công",
    });
  } catch (err) {
    console.error("Lỗi khi xóa vĩnh viễn sản phẩm:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa vĩnh viễn sản phẩm",
    });
  }
};

// Khôi phục sản phẩm đã xóa mềm
exports.restoreProduct = async (req, res) => {
  try {
    const productId = req.params.id; // 1. Kiểm tra ID sản phẩm hợp lệ

    // 1. Kiểm tra ID sản phẩm hợp lệ
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "ID sản phẩm không hợp lệ",
      });
    } // 2. Kiểm tra sản phẩm có tồn tại và đã bị xóa mềm

    // 2. Kiểm tra sản phẩm có tồn tại và đã bị xóa mềm
    const product = await Product.findOne({
      _id: productId,
      isDeleted: true,
    });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không tồn tại hoặc chưa bị xóa mềm",
      });
    } // 3. Thực hiện khôi phục sản phẩm

    // 3. Thực hiện khôi phục sản phẩm
    const restoredProduct = await Product.findByIdAndUpdate(
      productId,
      { isDeleted: false, updatedAt: new Date() },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Khôi phục sản phẩm thành công",
      data: restoredProduct,
    });
  } catch (err) {
    console.error("Lỗi khi khôi phục sản phẩm:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi khôi phục sản phẩm",
    });
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
    const { productId } = req.params; // 1. Kiểm tra ID hợp lệ

    // 1. Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res
        .status(400)
        .json({ success: false, message: "ID sản phẩm không hợp lệ" });
    } // 2. Lấy tất cả variations của productId và populate material

    const variations = await ProductVariation.find({ productId })
      .populate("material", "name") // chỉ lấy field 'name' trong material
      .lean(); // 3. Trích xuất danh sách tên chất liệu

    // 3. Trích xuất danh sách tên chất liệu
    const materialNames = variations
      .map((v) => v.material?.name)
      .filter(Boolean); // loại bỏ null/undefined // 4. Lọc trùng và ghép thành chuỗi

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

    if (!keyword || keyword.trim() === "") {
      return res.status(400).json({ message: "Thiếu từ khóa tìm kiếm" });
    }

    const query =
      strict === "true"
        ? { name: keyword.trim(), isDeleted: false, status: "active" } // tìm chính xác
        : {
            name: { $regex: keyword.trim(), $options: "i" },
            isDeleted: false,
            status: "active",
          }; // tìm tương đối (không phân biệt hoa thường)

    const products = await Product.find(query);
    res.status(200).json(products);
  } catch (err) {
    console.error("Lỗi tìm kiếm:", err);
    res.status(500).json({ message: "Lỗi server khi tìm kiếm sản phẩm" });
  }
};
