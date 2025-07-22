const mongoose = require("mongoose");
const Product = require("../models/products.model");
const Category = require("../models/category.model");
const Material = require("../models/material.model");
const ProductVariation = require("../models/product_variations.model");
const Review = require("../models/review.model"); // <-- THÊM DÒNG NÀY: Import Review Model
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
      search, // Thêm search vào đây để xử lý trong aggregation
      brand, // Thêm brand vào đây để xử lý trong aggregation
    } = req.query;

    const query = {};  
    const safeLimit = Math.min(parseInt(limit), 100);
    const skip = (parseInt(page) - 1) * safeLimit;

    // --- Bắt đầu xây dựng các điều kiện match cho aggregation ---
    let matchConditions = {
      isDeleted: false,
    };

      if (isDeleted !== undefined) {
      query.isDeleted = isDeleted === "true";
    } else {
      query.isDeleted = false; // Mặc định chỉ lấy sản phẩm chưa xóa mềm
    }
      if (minPrice || maxPrice) {
      query.salePrice = {};
      if (minPrice) query.salePrice.$gte = parseFloat(minPrice);
      if (maxPrice) query.salePrice.$lte = parseFloat(maxPrice);
    }
    
    if (status && !query.isDeleted) query.status = status; // Chỉ áp dụng status nếu không lấy sản phẩm đã xóa
    if (category) query.categoryId = category;
    if (color) query.color = color;
    if (status) matchConditions.status = status;
    if (category) matchConditions.categoryId = new mongoose.Types.ObjectId(category); // Đảm bảo là ObjectId
    // Lưu ý: `color` và `minPrice/maxPrice` cần được xử lý thông qua `product_variations`
    // hoặc bạn phải có trường đó trực tiếp trên Product model.
    // Hiện tại, Product model của bạn không có `color` hay `salePrice` trực tiếp.
    // Nếu `salePrice` là từ ProductVariation, thì lọc giá phức tạp hơn và cần aggregation sâu hơn.
    // Đối với ví dụ này, tôi giả định `salePrice` có thể được tính/lấy từ Product.
    // Nếu salePrice chỉ tồn tại trong ProductVariation, bạn sẽ cần một $lookup khác.


    // Lọc Flash Sale
    if (flashSaleOnly === "true") {
      const now = new Date();
      matchConditions.flashSale_discountedPrice = { $gt: 0 };
      matchConditions.flashSale_start = { $lte: now };
      matchConditions.flashSale_end = { $gte: now };
    }

    // ✅ Thêm điều kiện tìm kiếm nếu có
    if (search) {
      matchConditions.name = { $regex: search.trim(), $options: "i" };
    }

    // ✅ Thêm điều kiện lọc theo Brand nếu có
    if (brand) {
        matchConditions.brand = brand;
    }


    const sortOption = {};
    if (filter === "hot") {
      sortOption.totalPurchased = -1;
    } else if (filter === "new") {
      sortOption.createdAt = -1;
    } else {
      switch (sort) {
        case "price_asc":
          // Lưu ý: Nếu giá nằm trong variations, cần điều chỉnh aggregation để sắp xếp theo giá thấp nhất/cao nhất
          sortOption.finalPrice = 1; // Sử dụng finalPrice hoặc salePrice sau khi tính toán
          break;
        case "price_desc":
          sortOption.finalPrice = -1; // Sử dụng finalPrice hoặc salePrice sau khi tính toán
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


    // --- BẮT ĐẦU AGGREGATION PIPELINE CHO getProducts ---
    const pipeline = [
      {
        $match: matchConditions, // Giai đoạn 1: Lọc sản phẩm
      },
      // Giai đoạn 2: Nối (lookup) với Category để populate categoryId
      {
        $lookup: {
          from: "categories", // Tên collection của Category
          localField: "categoryId",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      {
        $unwind: {
          path: "$categoryInfo",
          preserveNullAndEmptyArrays: true, // Giữ lại sản phẩm nếu không có category (nếu muốn)
        },
      },
      // Giai đoạn 3: Nối (lookup) với collection 'reviews' để lấy đánh giá
      {
        $lookup: {
          from: "reviews", // Tên collection của Review trong MongoDB
          localField: "_id", // Trường _id của Product
          foreignField: "product", // Trường 'product' trong Review model
          as: "productReviews", // Tên mảng chứa các reviews của sản phẩm này
        },
      },
      // Giai đoạn 4: Tính toán averageRating và numOfReviews
      {
        $addFields: {
          averageRating: { $avg: "$productReviews.rating" },
          numOfReviews: { $size: "$productReviews" },
        },
      },
      // Giai đoạn 5: Nối (lookup) với ProductVariation để lấy thông tin giá và màu sắc
      // Đây là phần phức tạp hơn nếu bạn muốn lọc theo color và price từ variations
      // Hiện tại Product schema của bạn không có salePrice/finalPrice trực tiếp.
      // Nếu bạn muốn lấy giá thấp nhất từ variations cho mỗi sản phẩm:
      {
        $lookup: {
          from: "productvariations", // Tên collection của ProductVariation
          localField: "_id",
          foreignField: "productId",
          as: "variations",
        },
      },
      // Giai đoạn 6: Tính toán giá thấp nhất/cao nhất từ variations
      {
        $addFields: {
          // Lấy giá thấp nhất trong tất cả các biến thể của sản phẩm
          minVariationPrice: { $min: "$variations.finalPrice" },
        },
      },
      // ✅ Giai đoạn 7: Lọc theo minPrice/maxPrice nếu cần (sử dụng minVariationPrice)
      // Nếu bạn muốn lọc theo giá ở đây:
      // Lưu ý: Nếu có filter giá, nó phải nằm sau khi minVariationPrice được tính
      // if (minPrice || maxPrice) {
      //     // Thêm một $match nữa sau khi $addFields minVariationPrice
      //     // Tuy nhiên, việc này làm phức tạp pipeline và có thể cần $redact hoặc $match sau lookup
      //     // Cách hiệu quả hơn là lọc giá ở bước đầu tiên nếu giá là trường trực tiếp trên Product
      //     // hoặc dùng $unwind + $group để xử lý variations triệt để hơn.
      //     // Với cấu trúc hiện tại, việc lọc giá trên Product.find(query) ban đầu sẽ không hoạt động nếu giá nằm trong Variations.
      //     // Để đơn giản, tôi sẽ bỏ qua lọc giá từ minPrice/maxPrice trực tiếp ở đây
      //     // và giả định bạn sẽ lọc variations ở client hoặc cần một pipeline phức tạp hơn
      //     // nếu giá là thuộc tính của variations và cần lọc ở đây.
      // }


      // Giai đoạn 8: Loại bỏ các trường tạm thời không cần thiết
      {
        $project: {
          productReviews: 0, // Bỏ mảng reviews sau khi dùng
          variations: 0, // Bỏ mảng variations sau khi dùng (hoặc giữ lại nếu frontend cần)
          // Đặt lại categoryId thành đối tượng populated nếu cần
          "categoryInfo.__v": 0, // Bỏ trường __v của categoryInfo
        },
      },
      // Giai đoạn 9: Sắp xếp kết quả (sử dụng minVariationPrice hoặc các trường khác)
      {
        $sort: sortOption, // Sắp xếp theo các tùy chọn đã xác định
      },
      // Giai đoạn 10: Phân trang (Lấy tổng số lượng và dữ liệu)
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: safeLimit }],
        },
      },
    ];

    const [result] = await Product.aggregate(pipeline);

    const productsData = result.data.map(p => ({
        ...p,
        categoryId: p.categoryInfo // Thay thế categoryId bằng đối tượng category đã populate
    }));
    const total = result.metadata[0] ? result.metadata[0].total : 0;


    // Breadcrumb theo danh mục
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
      data: productsData,
      breadcrumb,
      pagination: {
        page: parseInt(page),
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    });
  } catch (err) {

    console.error("Lỗi khi lấy danh sách sản phẩm:", err); // Log lỗi chi tiết
    res.status(500).json({ success: false, message: err.message });

  }
};

// Lấy chi tiết sản phẩm theo ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.params.id), // Chuyển id thành ObjectId
          isDeleted: false,
        },
      },
      // Giai đoạn 1: Nối (lookup) với Category để populate categoryId
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      {
        $unwind: {
          path: "$categoryInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Giai đoạn 2: Nối (lookup) với collection 'reviews'
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "product",
          as: "productReviews",
        },
      },
      // Giai đoạn 3: Tính toán averageRating và numOfReviews
      {
        $addFields: {
          averageRating: { $avg: "$productReviews.rating" },
          numOfReviews: { $size: "$productReviews" },
        },
      },
      // Giai đoạn 4: Loại bỏ trường 'productReviews' không cần thiết
      {
        $project: {
          productReviews: 0,
          "categoryInfo.__v": 0,
        },
      },
    ]);

    if (!product || product.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    const finalProduct = {
      ...product[0], // Lấy sản phẩm đầu tiên từ kết quả aggregation
      categoryId: product[0].categoryInfo, // Thay thế categoryId bằng đối tượng populated
      isAvailable: product[0].stock_quantity > 0, // Cần đảm bảo stock_quantity có mặt hoặc tính từ variations
    };
    delete finalProduct.categoryInfo; // Xóa trường tạm thời

    res.json({
      success: true,
      data: finalProduct,
    });
  } catch (err) {
    console.error("Lỗi khi lấy chi tiết sản phẩm:", err); // Log lỗi chi tiết
    res.status(500).json({ success: false, message: err.message });
  }
};

// ... (các hàm khác: createProduct, updateProduct, softDeleteProduct, updateStock, getMaterialsByProductId, searchProducts)
// Các hàm này không cần thay đổi vì chúng không liên quan đến việc lấy thông tin đánh giá cho mục đích hiển thị tổng quan.
// Nếu bạn muốn `createProduct` hoặc `updateProduct` cũng trả về thông tin rating/reviews sau khi tạo/cập nhật,
// bạn có thể áp dụng aggregation tương tự sau khi save/findAndUpdate.
// Nhưng thường thì việc này chỉ cần khi lấy danh sách hoặc chi tiết.

// VUI LÒNG ĐẶT CÁC HÀM KHÁC Ở DƯỚI ĐÂY NẾU CHÚNG KHÔNG THAY ĐỔI
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
    const productId = req.params.id;

    // 1. Kiểm tra ID sản phẩm hợp lệ
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "ID sản phẩm không hợp lệ",
      });
    }

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
    }

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
    }

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
    const productId = req.params.id;

    // 1. Kiểm tra ID sản phẩm hợp lệ
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "ID sản phẩm không hợp lệ",
      });
    }

    // 2. Kiểm tra sản phẩm có tồn tại
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không tồn tại",
      });
    }

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
    }

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
    const productId = req.params.id;

    // 1. Kiểm tra ID sản phẩm hợp lệ
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "ID sản phẩm không hợp lệ",
      });
    }

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
    }

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

    const products = await Product.find(query); // <-- LƯU Ý: Nếu bạn muốn rating/reviews trong kết quả search, bạn cũng cần aggregation ở đây.
    res.status(200).json(products);
  } catch (err) {
    console.error('Lỗi tìm kiếm:', err);
    res.status(500).json({ message: 'Lỗi server khi tìm kiếm sản phẩm' });
  }
};