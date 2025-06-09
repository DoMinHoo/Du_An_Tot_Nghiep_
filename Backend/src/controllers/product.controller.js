    const Product = require('../models/products.model');
    const Category = require('../models/category.model'); // Giả định có model Category
    const mongoose = require('mongoose'); // Thêm dòng này để sửa lỗi mongoose is not defined

    // Lấy danh sách sản phẩm với bộ lọc
    exports.getProducts = async (req, res) => {
    try {
        const {
        page = 1,
        limit = 10,
        sort = 'createdAt',
        category,
        material,
        status = 'active',
        filter,
        } = req.query;

        const query = { isDeleted: false };

        // Lọc trạng thái sản phẩm
        if (status) query.status = status;

        // Lọc danh mục, chất liệu
        if (category) query.categoryId = category;
        if (material) query.material = material;

        const sortOption = {};
        switch (sort) {
        case 'bestseller':
            sortOption.totalPurchased = -1;
            break;
        default:
            sortOption.createdAt = -1;
        }

        // Ưu tiên lọc đặc biệt từ "filter" param
        if (filter === 'hot') sortOption.totalPurchased = -1;
        if (filter === 'new') sortOption.createdAt = -1;

        const safeLimit = Math.min(parseInt(limit), 100);
        const products = await Product.find(query)
        .populate('categoryId', 'name')
        .sort(sortOption)
        .skip((page - 1) * safeLimit)
        .limit(safeLimit);

        const total = await Product.countDocuments(query);

        res.json({
        success: true,
        data: products,
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
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ success: false, message: 'ID sản phẩm không hợp lệ' });
        }

        const product = await Product.findOne({ _id: req.params.id, isDeleted: false }).populate(
        'categoryId',
        'name'
        );
        if (!product) {
        return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
        }

        res.json({
        success: true,
        data: product,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
    };

    // Tạo sản phẩm mới
    exports.createProduct = async (req, res) => {
    try {
        const body = req.body || {};
        const uploadedImages = req.files ? req.files.map(file => `/uploads/banners/${file.filename}`) : [];

        // Kiểm tra các trường bắt buộc
        const requiredFields = ['name', 'brand', 'descriptionShort', 'descriptionLong', 'material', 'categoryId'];
        for (const field of requiredFields) {
        if (!body[field]) {
            return res.status(400).json({ success: false, message: `Trường ${field} là bắt buộc` });
        }
        }

        // Kiểm tra categoryId hợp lệ
        if (!mongoose.Types.ObjectId.isValid(body.categoryId)) {
        return res.status(400).json({ success: false, message: 'ID danh mục không hợp lệ' });
        }

        // Kiểm tra danh mục tồn tại
        const category = await Category.findById(body.categoryId);
        if (!category) {
        return res.status(400).json({ success: false, message: 'Danh mục không tồn tại' });
        }

        const productData = {
        name: body.name,
        brand: body.brand,
        descriptionShort: body.descriptionShort,
        descriptionLong: body.descriptionLong,
        material: body.material,
        categoryId: body.categoryId,
        image: uploadedImages,
        totalPurchased: parseInt(body.totalPurchased) || 0,
        isDeleted: body.isDeleted === 'true' || false,
        status: body.status || 'active',
        };

        const product = new Product(productData);
        await product.save();

        res.status(201).json({ success: true, data: product });
    } catch (error) {
        console.error('Lỗi khi tạo sản phẩm:', error);
        res.status(400).json({ success: false, message: error.message });
    }
    };

    // Cập nhật sản phẩm
    exports.updateProduct = async (req, res) => {
    try {
        const id = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'ID sản phẩm không hợp lệ' });
        }

        const product = await Product.findById(id);
        if (!product || product.isDeleted) {
        return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại hoặc đã bị xóa' });
        }

        const body = req.body || {};
        const uploadedImages = req.files ? req.files.map(file => `/uploads/banners/${file.filename}`) : [];
        let existingImages = [];
        try {
        existingImages = body.existingImages ? JSON.parse(body.existingImages) : [];
        } catch (error) {
        return res.status(400).json({ success: false, message: 'Danh sách ảnh hiện có không hợp lệ' });
        }

        // Kết hợp ảnh mới và ảnh hiện có
        const finalImages = [...existingImages, ...uploadedImages];

        // Kiểm tra các trường bắt buộc
        const requiredFields = ['name', 'brand', 'descriptionShort', 'descriptionLong', 'material', 'categoryId'];
        for (const field of requiredFields) {
        if (!body[field] && !product[field]) {
            return res.status(400).json({ success: false, message: `Trường ${field} là bắt buộc` });
        }
        }

        // Kiểm tra categoryId hợp lệ
        if (body.categoryId) {
        if (!mongoose.Types.ObjectId.isValid(body.categoryId)) {
            return res.status(400).json({ success: false, message: 'ID danh mục không hợp lệ' });
        }
        const category = await Category.findById(body.categoryId);
        if (!category) {
            return res.status(400).json({ success: false, message: 'Danh mục không tồn tại' });
        }
        }

        const productData = {
        name: body.name || product.name,
        brand: body.brand || product.brand,
        descriptionShort: body.descriptionShort || product.descriptionShort,
        descriptionLong: body.descriptionLong || product.descriptionLong,
        material: body.material || product.material,
        categoryId: body.categoryId || product.categoryId,
        image: finalImages.length > 0 ? finalImages : product.image,
        totalPurchased: parseInt(body.totalPurchased) || product.totalPurchased,
        isDeleted: body.isDeleted === 'true' || product.isDeleted,
        status: body.status || product.status,
        };

        const updatedProduct = await Product.findByIdAndUpdate(id, productData, { new: true }).populate(
        'categoryId',
        'name'
        );

        res.status(200).json({ success: true, data: updatedProduct });
    } catch (error) {
        console.error('Lỗi khi cập nhật sản phẩm:', error);
        res.status(500).json({ success: false, message: error.message });
    }
    };

    // Xóa mềm sản phẩm
    exports.softDeleteProduct = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ success: false, message: 'ID sản phẩm không hợp lệ' });
        }

        const updated = await Product.findOneAndUpdate(
        { _id: req.params.id, isDeleted: false },
        { isDeleted: true },
        { new: true }
        );
        if (!updated) {
        return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
        }
        res.json({ success: true, message: 'Xóa mềm sản phẩm thành công' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
    };