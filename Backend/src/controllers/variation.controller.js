const mongoose = require('mongoose');
const ProductVariation = require('../models/product_variations.model');
const Product = require('../models/products.model');
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
      'stockQuantity', 'colorName', 'colorHexCode', 'materialVariation'
    ];
    for (const field of requiredFields) {
      if (!body[field]) {
        return res.status(400).json({ success: false, message: `Trường ${field} là bắt buộc` });
      }
    }

    // 4. Xử lý hình ảnh (từ cả req.files và body.colorImageUrl)
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

    // 5. Kiểm tra SKU duy nhất
    const existingVariation = await ProductVariation.findOne({ sku: body.sku });
    if (existingVariation) {
      return res.status(400).json({ success: false, message: 'Mã SKU đã tồn tại' });
    }
    const existingMaterialVariation = await ProductVariation.findOne({ materialVariation: body.materialVariation });
    if (existingMaterialVariation) {
      return res.status(400).json({ success: false, message: 'Biến thể chất liệu đã tồn tại' });
    }

    // 6. Tính finalPrice
    const basePrice = parseFloat(body.basePrice);
    const priceAdjustment = parseFloat(body.priceAdjustment || 0);
    if (isNaN(basePrice)) {
      return res.status(400).json({ success: false, message: 'Trường basePrice phải là số' });
    }
    const finalPrice = body.finalPrice
      ? parseFloat(body.finalPrice)
      : basePrice + priceAdjustment;

    // 7. Tạo dữ liệu
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
      materialVariation: body.materialVariation
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
      const { id } = req.params;
      const body = req.body || {};

      // Kiểm tra id hợp lệ
      if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({ success: false, message: 'ID biến thể không hợp lệ' });
      }

      // Kiểm tra biến thể tồn tại
      const variation = await ProductVariation.findById(id);
      if (!variation) {
          return res.status(404).json({ success: false, message: 'Biến thể không tồn tại' });
      }

      // Kiểm tra SKU duy nhất nếu được cập nhật
      if (body.sku && body.sku !== variation.sku) {
          const existingVariation = await ProductVariation.findOne({ sku: body.sku });
          if (existingVariation) {
              return res.status(400).json({ success: false, message: 'Mã SKU đã tồn tại' });
          }
      }

      // Xử lý hình ảnh (tương tự createVariation)
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
          return res.status(400).json({ success: false, message: 'Ảnh màu (colorImageUrl) là bắt buộc' });
      }

      // Tính lại finalPrice nếu basePrice hoặc priceAdjustment thay đổi
      const basePrice = body.basePrice ? parseFloat(body.basePrice) : variation.basePrice;
      const priceAdjustment = body.priceAdjustment ? parseFloat(body.priceAdjustment) : variation.priceAdjustment;
      const finalPrice = body.finalPrice ? parseFloat(body.finalPrice) : (basePrice + priceAdjustment);

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
          materialVariation: body.materialVariation || variation.materialVariation
      };

      const updatedVariation = await ProductVariation.findByIdAndUpdate(id, variationData, { new: true });

      res.json({ success: true, data: updatedVariation });
  } catch (err) {
      console.error('Lỗi khi cập nhật biến thể:', err);
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

        const variations = await ProductVariation.find({ productId }).lean();
        res.json({ success: true, data: variations });
    } catch (err) {
        console.error('Lỗi khi truy vấn biến thể:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Xóa một biến thể sản phẩm
exports.deleteVariation = async (req, res) => {
    try {
        const { id } = req.params;

        // Kiểm tra id hợp lệ
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'ID biến thể không hợp lệ' });
        }

        const deleted = await ProductVariation.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Biến thể không tồn tại' });
        }

        res.json({ success: true, message: 'Xóa biến thể thành công' });
    } catch (err) {
        console.error('Lỗi khi xóa biến thể:', err);
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

    // Tìm biến thể theo ID
    const variation = await ProductVariation.findById(id).lean();
    if (!variation) {
      return res.status(404).json({ success: false, message: 'Biến thể không tồn tại' });
    }

    res.json({ success: true, data: variation });
  } catch (err) {
    console.error('Lỗi khi lấy chi tiết biến thể:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
