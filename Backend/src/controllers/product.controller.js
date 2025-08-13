const mongoose = require("mongoose");
const Product = require("../models/products.model");
const Category = require("../models/category.model");
const Material = require("../models/material.model");
const ProductVariation = require("../models/product_variations.model");
const Review = require("../models/review.model"); // Thêm dòng này để import Review model
const path = require("path");

function escapeRegex(string = "") {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
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
// controllers/productController.js (createProduct)
exports.createProduct = async (req, res) => {
  try {
    const body = req.body || {};

    // parse variations if present (sent as JSON string via form-data)
    const variationsPayload = body.variations ? JSON.parse(body.variations) : [];

    // --- product name handling & validation
    const productName = (body.name || '').trim();
    if (!productName) {
      return res.status(400).json({ success: false, message: 'Tên sản phẩm là bắt buộc.' });
    }

    // check product name duplicate (case-insensitive exact match)
    const nameRegex = new RegExp(`^${escapeRegex(productName)}$`, 'i');
    const existingProductByName = await Product.findOne({ name: nameRegex, isDeleted: false }).lean();
    if (existingProductByName) {
      return res.status(400).json({
        success: false,
        field: 'name',
        message: `Sản phẩm "${productName}" đã tồn tại. Vui lòng đổi tên khác.`
      });
    }

    // --- validations inside variations payload
    // a) duplicate SKUs inside payload
    const skusInPayload = variationsPayload.map(v => (v.sku || '').trim()).filter(Boolean);
    const duplicateSkusInPayload = skusInPayload.filter((s, i) => skusInPayload.indexOf(s) !== i);
    if (duplicateSkusInPayload.length) {
      return res.status(400).json({
        success: false,
        message: `Các SKU bị trùng trong request: ${[...new Set(duplicateSkusInPayload)].join(', ')}`
      });
    }

    // b) duplicate variation names inside payload (case-insensitive)
    const varNames = variationsPayload.map(v => (v.name || '').trim().toLowerCase()).filter(Boolean);
    const duplicateVarNames = varNames.filter((n, i) => varNames.indexOf(n) !== i);
    if (duplicateVarNames.length) {
      return res.status(400).json({
        success: false,
        message: `Tên biến thể bị trùng trong request: ${[...new Set(duplicateVarNames)].join(', ')}`
      });
    }

    // c) duplicate color names inside payload (case-insensitive)
    const colorNames = variationsPayload.map(v => (v.colorName || '').trim().toLowerCase()).filter(Boolean);
    const duplicateColorNames = colorNames.filter((c, i) => colorNames.indexOf(c) !== i);
    if (duplicateColorNames.length) {
      return res.status(400).json({
        success: false,
        message: `Tên màu bị trùng trong các biến thể: ${[...new Set(duplicateColorNames)].join(', ')}`
      });
    }

    // d) check SKUs already exist in DB (global unique). If you want sku unique per product,
    // change query or schema index accordingly.
    if (skusInPayload.length > 0) {
      const existing = await ProductVariation.find({ sku: { $in: skusInPayload } }).lean();
      if (existing.length > 0) {
        const existSkus = [...new Set(existing.map(e => e.sku))];
        return res.status(400).json({
          success: false,
          field: 'sku',
          message: `Các SKU sau đã tồn tại trong hệ thống: ${existSkus.join(', ')}`
        });
      }
    }

    // --- handle product images coming via multer (req.files)
    const uploadImages = Array.isArray(req.files)
      ? req.files.map((file) => `/uploads/banners/${path.basename(file.path)}`)
      : [];

    // --- create product
    const product = new Product({
      name: productName,
      descriptionShort: body.descriptionShort || '',
      descriptionLong: body.descriptionLong || '',
      categoryId: body.categoryId || null,
      image: uploadImages,
      status: body.status || 'active',
      isDeleted: false
    });

    await product.save();

    // --- prepare and insert variations (if any)
    let savedVariations = [];
    if (variationsPayload.length) {
      // normalize and validate each variation before insert
      const toInsert = variationsPayload.map(v => {
        const copy = { ...v, productId: product._id };

        // Validate material id format if present (but do not convert to ObjectId here)
        if (copy.material && !mongoose.Types.ObjectId.isValid(copy.material)) {
          throw new Error(`Invalid material id: ${copy.material}`);
        }

        // numeric casts
        if (copy.basePrice !== undefined) copy.basePrice = Number(copy.basePrice || 0);
        if (copy.priceAdjustment !== undefined) copy.priceAdjustment = Number(copy.priceAdjustment || 0);
        if (copy.finalPrice !== undefined) copy.finalPrice = Number(copy.finalPrice || copy.basePrice + (copy.priceAdjustment || 0));
        if (copy.stockQuantity !== undefined) copy.stockQuantity = parseInt(copy.stockQuantity, 10) || 0;

        // keep colorImageUrl as provided (should be string). If you upload images earlier, ensure frontend set colorImageUrl
        // ensure required fields are present (basic check)
        const required = ['name', 'sku', 'dimensions', 'basePrice', 'stockQuantity', 'colorName', 'colorHexCode', 'material'];
        for (const f of required) {
          if (copy[f] === undefined || copy[f] === null || String(copy[f]).trim() === '') {
            throw new Error(`Trường bắt buộc của biến thể thiếu: ${f}`);
          }
        }

        return copy;
      });

      try {
        // ordered:true will stop at first error. You can set ordered:false to insert as many as possible.
        savedVariations = await ProductVariation.insertMany(toInsert, { ordered: true });
      } catch (insErr) {
        // rollback created product to avoid orphan
        console.error('Insert variations failed, rolling back product:', insErr);
        await Product.deleteOne({ _id: product._id });

        if (insErr && insErr.code === 11000) {
          const field = Object.keys(insErr.keyValue || {})[0];
          const value = insErr.keyValue ? insErr.keyValue[field] : undefined;
          return res.status(400).json({
            success: false,
            field: field || 'unknown',
            message: value ? `${field} "${value}" đã tồn tại.` : 'Duplicate key error khi thêm biến thể'
          });
        }

        return res.status(400).json({ success: false, message: insErr.message || 'Lỗi khi thêm biến thể' });
      }
    }

    // success
    return res.status(201).json({
      success: true,
      message: 'Thêm sản phẩm thành công',
      data: { product, variations: savedVariations }
    });

  } catch (error) {
    console.error('Error creating product:', error);

    // friendly duplicate handler
    if (error && error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0];
      const value = error.keyValue ? error.keyValue[field] : undefined;
      return res.status(400).json({
        success: false,
        field: field || 'unknown',
        message: value ? `${field} "${value}" đã tồn tại.` : 'Duplicate key error'
      });
    }

    // validation-like error messages
    if (error && error.message) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(500).json({ success: false, message: 'Lỗi server khi tạo sản phẩm' });
  }
};

// Cập nhật sản phẩm
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    const uploadImages = Array.isArray(req.files)
      ? req.files.map((file) => `/uploads/banners/${path.basename(file.path)}`)
      : [];

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không tồn tại",
      });
    }
    product.name = body.name || product.name;
    product.descriptionShort = body.descriptionShort || product.descriptionShort;
    product.descriptionLong = body.descriptionLong || product.descriptionLong;
    product.categoryId = body.categoryId || product.categoryId;
    product.status = body.status || product.status;
    if (uploadImages.length > 0) {
      product.image = uploadImages; // Cập nhật ảnh mới
    }
    await product.save();

    let updateVariations = [];
    if (body.variations) {
      const variationsData = JSON.parse(body.variations);

      for (const variation of variationsData) {
        if (variation._id) {
          // Cập nhật biến thể đã tồn tại
          const updated = await ProductVariation.findByIdAndUpdate(
            variation._id,
            {
              ...variation,
              productId: id,
            },
            { new: true }
          );
          if (updated) updateVariations.push(updated);
        }
        else {
          const created = await ProductVariation.create({
            ...variation,
            productId: id,
          });
          updateVariations.push(created)
        }
      }
    }
    return res.status(200).json({
      success: true,
      message: "Cap nhat san pham thanh cong",
      data: {
        product: product,
        variations: updateVariations
      }
    })
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(400).json({ success: false, message: error.message });
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
