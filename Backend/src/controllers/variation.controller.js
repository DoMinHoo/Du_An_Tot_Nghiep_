const mongoose = require('mongoose');
const ProductVariation = require('../models/product_variations.model');
const Product = require('../models/products.model');
const Material = require('../models/material.model'); // <--- Import model chất liệu
const path = require('path');



exports.createVariation = async (req, res) => {
  try {
    const { productId } = req.params;
    const body = req.body || {};

    // 1. Kiểm tra productId hợp lệ
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'ID sản phẩm không hợp lệ' });
    }

    // 2. Kiểm tra sản phẩm tồn tại
    const product = await Product.findOne({ _id: productId, isDeleted: false });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }

    // 3. Kiểm tra các trường bắt buộc
    const requiredFields = [
      'name', 'sku', 'dimensions', 'basePrice', 'importPrice',
      'stockQuantity', 'colorName', 'colorHexCode', 'material'
    ];
    for (const field of requiredFields) {
      if (!body[field]) {
        return res.status(400).json({ success: false, message: `Trường ${field} là bắt buộc` });
      }
    }

    // 4. Kiểm tra material ID
    if (!mongoose.Types.ObjectId.isValid(body.material)) {
      return res.status(400).json({ success: false, message: 'ID chất liệu không hợp lệ' });
    }
    const materialExists = await Material.findById(body.material);
    if (!materialExists) {
      return res.status(400).json({ success: false, message: 'Chất liệu không tồn tại' });
    }

    const existingVariation = await ProductVariation.findOne({
      productId,
      material: body.material,
      dimensions: body.dimensions,
    });
    if (existingVariation) {
      return res.status(400).json({ success: false, message: 'Biến thể này đã tồn tại (cùng chất liệu và kích thước)' });
    }
    // 5. Xử lý hình ảnh
    const uploadedImages = Array.isArray(req.files)
      ? req.files.map((file) => `/uploads/banners/${path.basename(file.path)}`)
      : [];

    const bodyImages = Array.isArray(body.colorImageUrl)
      ? body.colorImageUrl
      : body.colorImageUrl
        ? [body.colorImageUrl]
        : [];

    const colorImageUrl = [...uploadedImages, ...bodyImages][0];

    if (!colorImageUrl) {
      return res.status(400).json({ success: false, message: 'Ảnh màu (colorImageUrl) là bắt buộc' });
    }

    // 6. Kiểm tra SKU duy nhất
    const existingMaterialVariation = await ProductVariation.findOne({
      productId,
      material: body.material,
      dimensions: body.dimensions,
      colorName: body.colorName
    });
    if (existingMaterialVariation) {
      return res.status(400).json({ success: false, message: 'Biến thể này đã tồn tại (cùng chất liệu, kích thước, màu)' });
    }

    // 7. Tính finalPrice
    const basePrice = parseFloat(body.basePrice);
    const priceAdjustment = parseFloat(body.priceAdjustment || 0);
    if (isNaN(basePrice)) {
      return res.status(400).json({ success: false, message: 'Trường basePrice phải là số' });
    }
    const finalPrice = body.finalPrice
      ? parseFloat(body.finalPrice)
      : basePrice + priceAdjustment;

    // 8. Tạo dữ liệu
    const variationData = {
      productId,
      name: body.name,
      sku: body.sku,
      dimensions: body.dimensions,
      basePrice,
      priceAdjustment,
      finalPrice,
      importPrice: parseFloat(body.importPrice),
      salePrice: body.salePrice ? parseFloat(body.salePrice) : null,
      flashSaleDiscountedPrice: body.flashSaleDiscountedPrice ? parseFloat(body.flashSaleDiscountedPrice) : null,
      flashSaleStart: body.flashSaleStart ? new Date(body.flashSaleStart) : null,
      flashSaleEnd: body.flashSaleEnd ? new Date(body.flashSaleEnd) : null,
      stockQuantity: parseInt(body.stockQuantity),
      colorName: body.colorName,
      colorHexCode: body.colorHexCode,
      colorImageUrl,
      material: body.material,// ✅ Gán ObjectId chất liệu đúng
      isDeleted: false // Mặc định là false khi tạo mới
    };

    const variation = new ProductVariation(variationData);
    await variation.save();

    res.status(201).json({ success: true, data: variation });
  } catch (err) {
    console.error('Lỗi khi tạo biến thể:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};
// Cập nhật một biến thể sản phẩm
exports.updateVariation = async (req, res) => {
  try {
    console.log("✅ Backend nhận material:", req.body.material);
    const { id } = req.params;
    const body = req.body || {};

    // 1. Kiểm tra id biến thể hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "ID biến thể không hợp lệ" });
    }

    // 2. Tìm biến thể
    const variation = await ProductVariation.findById(id, { isDeleted: false });
    if (!variation) {
      return res.status(404).json({ success: false, message: "Biến thể không tồn tại" });
    }

    // 3. Kiểm tra trùng SKU nếu thay đổi
    if (body.sku && body.sku !== variation.sku) {
      const existingVariation = await ProductVariation.findOne({ sku: body.sku });
      if (existingVariation) {
        return res.status(400).json({ success: false, message: "Mã SKU đã tồn tại" });
      }
    }

    // 4. Kiểm tra material nếu có cập nhật
    let materialId = variation.material; // mặc định giữ nguyên
    if (body.material) {
      if (!mongoose.Types.ObjectId.isValid(body.material)) {
        return res.status(400).json({ success: false, message: "ID chất liệu không hợp lệ" });
      }

      const materialExists = await Material.findById(body.material);
      if (!materialExists) {
        return res.status(400).json({ success: false, message: "Chất liệu không tồn tại" });
      }

      materialId = body.material; // ✅ cập nhật mới
    }

    // 5. Xử lý ảnh
    const uploadedImages = Array.isArray(req.files)
      ? req.files.map((file) => `/uploads/banners/${path.basename(file.path)}`)
      : [];

    const bodyImages = Array.isArray(body.colorImageUrl)
      ? body.colorImageUrl
      : body.colorImageUrl
        ? [body.colorImageUrl]
        : [];

    const colorImageUrl = [...uploadedImages, ...bodyImages][0] || variation.colorImageUrl;

    if (!colorImageUrl) {
      return res.status(400).json({ success: false, message: "Ảnh màu (colorImageUrl) là bắt buộc" });
    }

    // 6. Tính lại giá
    const basePrice = body.basePrice ? parseFloat(body.basePrice) : variation.basePrice;
    const priceAdjustment = body.priceAdjustment ? parseFloat(body.priceAdjustment) : variation.priceAdjustment;
    const finalPrice = body.finalPrice ? parseFloat(body.finalPrice) : basePrice + priceAdjustment;

    // 7. Gộp dữ liệu để cập nhật
    const variationData = {
      name: body.name || variation.name,
      sku: body.sku || variation.sku,
      dimensions: body.dimensions || variation.dimensions,
      basePrice,
      priceAdjustment,
      finalPrice,
      importPrice: body.importPrice ? parseFloat(body.importPrice) : variation.importPrice,
      salePrice: body.salePrice ? parseFloat(body.salePrice) : variation.salePrice,
      flashSaleDiscountedPrice: body.flashSaleDiscountedPrice
        ? parseFloat(body.flashSaleDiscountedPrice)
        : variation.flashSaleDiscountedPrice,
      flashSaleStart: body.flashSaleStart ? new Date(body.flashSaleStart) : variation.flashSaleStart,
      flashSaleEnd: body.flashSaleEnd ? new Date(body.flashSaleEnd) : variation.flashSaleEnd,
      stockQuantity: body.stockQuantity ? parseInt(body.stockQuantity) : variation.stockQuantity,
      colorName: body.colorName || variation.colorName,
      colorHexCode: body.colorHexCode || variation.colorHexCode,
      colorImageUrl,
      material: materialId, // ✅ gán đúng material đã kiểm tra ở trên

    };

    // 8. Cập nhật vào DB
    const updatedVariation = await ProductVariation.findByIdAndUpdate(id, variationData, { new: true });

    res.json({ success: true, data: updatedVariation });
  } catch (err) {
    console.error("Lỗi khi cập nhật biến thể:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// Lấy danh sách biến thể theo productId
exports.getVariationsByProductId = async (req, res) => {
  try {
    const { productId } = req.params;

    // Kiểm tra productId hợp lệ
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'ID sản phẩm không hợp lệ' });
    }

    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findOne({ _id: productId, isDeleted: false });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }

    // Truy vấn và populate field "material", chỉ lấy các biến thể chưa bị xóa
    const variations = await ProductVariation.find({ productId, isDeleted: false })
      .populate('material', 'name')
      .lean();

    res.json({ success: true, data: variations });
  } catch (err) {
    console.error('Lỗi khi truy vấn biến thể:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Lấy chi tiết một biến thể sản phẩm
exports.getVariationById = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra id hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID biến thể không hợp lệ' });
    }

    // Tìm biến thể theo ID, chỉ lấy biến thể chưa bị xóa
    const variation = await ProductVariation.findOne({ _id: id, isDeleted: false })
      .populate('material', 'name')
      .lean();

    if (!variation) {
      return res.status(404).json({ success: false, message: 'Biến thể không tồn tại hoặc đã bị xóa' });
    }

    res.json({ success: true, data: variation });
  } catch (err) {
    console.error('Lỗi khi lấy chi tiết biến thể:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Xóa mềm một biến thể sản phẩm
exports.deleteVariation = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Kiểm tra ID biến thể hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID biến thể không hợp lệ' });
    }

    // 2. Tìm biến thể
    const variation = await ProductVariation.findOne({ _id: id, isDeleted: false });
    if (!variation) {
      return res.status(404).json({ success: false, message: 'Biến thể không tồn tại hoặc đã bị xóa' });
    }

    // 3. Cập nhật trạng thái isDeleted
    variation.isDeleted = true;
    await variation.save();

    res.json({ success: true, message: 'Biến thể đã được xóa mềm thành công' });
  } catch (err) {
    console.error('Lỗi khi xóa mềm biến thể:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
// Khôi phục một biến thể đã bị xóa mềm
exports.restoreVariation = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Kiểm tra ID biến thể hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID biến thể không hợp lệ' });
    }

    // 2. Tìm biến thể đã bị xóa mềm
    const variation = await ProductVariation.findOne({ _id: id, isDeleted: true });
    if (!variation) {
      return res.status(404).json({ success: false, message: 'Biến thể không tồn tại hoặc chưa bị xóa mềm' });
    }

    // 3. Khôi phục biến thể
    variation.isDeleted = false;
    await variation.save();

    res.json({ success: true, message: 'Biến thể đã được khôi phục thành công', data: variation });
  } catch (err) {
    console.error('Lỗi khi khôi phục biến thể:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Lấy danh sách biến thể đã xóa mềm theo productId
exports.getDeletedVariations = async (req, res) => {
  try {
    const { productId } = req.params;
    console.log('Received productId:', productId);

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      console.log('Invalid productId:', productId);
      return res.status(400).json({ success: false, message: 'ID sản phẩm không hợp lệ' });
    }

    const product = await Product.findOne({ _id: productId }); // Bỏ isDeleted: false
    if (!product) {
      console.log('Product not found:', productId);
      return res.json({ success: true, data: [] }); // Trả về mảng rỗng thay vì lỗi
    }

    const variations = await ProductVariation.find({ productId, isDeleted: true })
      .populate('material', 'name')
      .lean();
    console.log('Deleted variations found:', variations.length);

    res.json({ success: true, data: variations });
  } catch (err) {
    console.error('Error in getDeletedVariations:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};