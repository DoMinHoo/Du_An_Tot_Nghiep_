
const Product = require('../models/products.model');

// Lấy danh sách sản phẩm với filter
exports.getProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            sort = 'createdAt',
            category,
            material,
            status = 'active',
            filter
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
            .populate('categoryId')
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
                totalPages: Math.ceil(total / safeLimit)
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Lấy chi tiết sản phẩm theo ID
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findOne({ _id: req.params.id, isDeleted: false }).populate('categoryId');
        if (!product) return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });

        res.json({
            success: true,
            data: product
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Tạo sản phẩm
exports.createProduct = async (req, res) => {
    try {
        const uploadedImages = req.files ? req.files.map(file => `/uploads/banners/${file.filename}`) : [];
        const body = req.body || {};

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
            status: body.status || 'active'
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
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
        }

        const uploadedImages = req.files ? req.files.map(file => `/uploads//${file.filename}`) : [];
        const body = req.body || {};

        let finalImages = product.image;
        if (uploadedImages.length > 0) {
            finalImages = uploadedImages;
        }

        const productData = {
            name: body.name || product.name,
            brand: body.brand || product.brand,
            descriptionShort: body.descriptionShort || product.descriptionShort,
            descriptionLong: body.descriptionLong || product.descriptionLong,
            material: body.material || product.material,
            categoryId: body.categoryId || product.categoryId,
            image: finalImages,
            totalPurchased: parseInt(body.totalPurchased) || product.totalPurchased,
            isDeleted: body.isDeleted === 'true' || product.isDeleted,
            status: body.status || product.status
        };

        const updatedProduct = await Product.findByIdAndUpdate(id, productData, { new: true }).populate('categoryId');

        res.status(200).json({ success: true, data: updatedProduct });
    } catch (error) {
        console.error('Lỗi khi cập nhật sản phẩm:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// Xóa mềm sản phẩm
exports.softDeleteProduct = async (req, res) => {
    try {
        const updated = await Product.findOneAndUpdate(
            { _id: req.params.id, isDeleted: false },
            { isDeleted: true },
            { new: true }
        );
        if (!updated) return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
        res.json({ success: true, message: 'Xóa mềm sản phẩm thành công' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};