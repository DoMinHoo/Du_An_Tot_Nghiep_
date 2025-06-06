const Product = require('../models/products.model');

// Lấy danh sách sản phẩm với filter
exports.getProducts = async (req, res) => {
    try {
        const {
            page = 1, limit = 10, sort = 'created_at',
            category, color, material, minPrice, maxPrice,
            status = 'active', flashSaleOnly = false, filter
        } = req.query;

        const query = { isDeleted: false };

        // Lọc trạng thái sản phẩm
        if (status) query.status = status;

        // Lọc danh mục, chất liệu, màu
        if (category) query.categoryId = category;
        if (color) query.color = color;
        if (material) query.material = material;

        // Lọc theo giá
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseFloat(minPrice);
            if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }

        // Lọc sản phẩm đang có Flash Sale
        if (flashSaleOnly === 'true') {
            const now = new Date();
            query.flashSale_discountedPrice = { $gt: 0 };
            query.flashSale_start = { $lte: now };
            query.flashSale_end = { $gte: now };
        }


        const sortOption = {};
        switch (sort) {
            case 'price_asc': sortOption.price = 1; break;
            case 'price_desc': sortOption.price = -1; break;
            case 'bestseller': sortOption.totalPurchased = -1; break;
            default: sortOption.createdAt = -1;
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
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        res.json({
            success: true,
            data: {
                ...product._doc,
                isAvailable: product.stock_quantity > 0
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Tạo sản phẩm
    exports.createProduct = async (req, res) => {
        try {
        const uploadedImages = req.files ? req.files.map(file => `/uploads/img/${file.filename}`) : [];
        const body = req.body || {};
    
        console.log('Uploaded images:', uploadedImages); // Log để kiểm tra
    
        const productData = {
            ...body,
            image: uploadedImages,
            price: parseFloat(body.price) || 0,
            importPrice: parseFloat(body.importPrice) || 0,
            salePrice: parseFloat(body.salePrice) || 0,
            flashSale_discountedPrice: parseFloat(body.flashSale_discountedPrice) || 0,
            flashSale_start: body.flashSale_start ? new Date(body.flashSale_start) : undefined,
            flashSale_end: body.flashSale_end ? new Date(body.flashSale_end) : undefined,
            weight: parseFloat(body.weight) || 0,
            stock_quantity: parseInt(body.stock_quantity) || 0,
            isDeleted: body.isDeleted === 'true' || false,
            categoryId: body.categoryId,
        };
    
        const product = new Product(productData);
        await product.save();
    
        res.status(201).json(product);
        } catch (error) {
        console.error('Error in createProduct:', error);
        res.status(400).json({ message: error.message });
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

        // Lấy danh sách ảnh mới từ file upload
        const uploadedImages = req.files ? req.files.map(file => `/uploads/img/${file.filename}`) : [];
        const body = req.body || {};

        console.log('Uploaded images:', uploadedImages); // Log để kiểm tra

        // Nếu có ảnh mới, xóa ảnh cũ
        let finalImages = product.image; // Mặc định giữ ảnh cũ
        if (uploadedImages.length > 0) {
            if (product.image && product.image.length > 0) {
                product.image.forEach((oldImage) => {
                    const oldImagePath = path.join(__dirname, '..', oldImage);
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath); // Xóa file ảnh cũ
                    }
                });
            }
            finalImages = uploadedImages; // Sử dụng ảnh mới
        }

        // Kiểm tra và parse dữ liệu số
        const price = parseFloat(body.price) || product.price;
        const importPrice = parseFloat(body.importPrice) || product.importPrice;
        const salePrice = parseFloat(body.salePrice) || 0;
        const flashSale_discountedPrice = parseFloat(body.flashSale_discountedPrice) || 0;
        const weight = parseFloat(body.weight) || product.weight;
        const stock_quantity = parseInt(body.stock_quantity) || product.stock_quantity;

        // Kiểm tra dữ liệu hợp lệ
        if (isNaN(price) || price < 0) {
            return res.status(400).json({ success: false, message: 'Giá bán không hợp lệ' });
        }
        if (isNaN(importPrice) || importPrice < 0) {
            return res.status(400).json({ success: false, message: 'Giá nhập không hợp lệ' });
        }
        if (isNaN(salePrice) || salePrice < 0) {
            return res.status(400).json({ success: false, message: 'Giá khuyến mãi không hợp lệ' });
        }
        if (isNaN(flashSale_discountedPrice) || flashSale_discountedPrice < 0) {
            return res.status(400).json({ success: false, message: 'Giá Flash Sale không hợp lệ' });
        }
        if (isNaN(weight) || weight < 0) {
            return res.status(400).json({ success: false, message: 'Khối lượng không hợp lệ' });
        }
        if (stock_quantity < 0) {
            return res.status(400).json({ success: false, message: 'Số lượng tồn kho không hợp lệ' });
        }

        // Cập nhật dữ liệu sản phẩm
        const productData = {
            name: body.name || product.name,
            descriptionShort: body.descriptionShort || product.descriptionShort,
            descriptionLong: body.descriptionLong || product.descriptionLong,
            material: body.material || product.material,
            dimensions: body.dimensions || product.dimensions,
            image: finalImages,
            price,
            importPrice,
            salePrice,
            flashSale_discountedPrice,
            flashSale_start: body.flashSale_start ? new Date(body.flashSale_start) : product.flashSale_start,
            flashSale_end: body.flashSale_end ? new Date(body.flashSale_end) : product.flashSale_end,
            weight,
            stock_quantity,
            isDeleted: body.isDeleted === 'true' || product.isDeleted,
            categoryId: body.categoryId || product.categoryId,
            status: body.status || product.status,
        };

        // Cập nhật sản phẩm trong cơ sở dữ liệu
        const updatedProduct = await Product.findByIdAndUpdate(id, productData, { new: true }).populate('categoryId');

        res.status(200).json({ success: true, data: updatedProduct });
    } catch (error) {
        console.error('Error in updateProduct:', error);
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
        if (!updated) return res.status(404).json({ success: false, message: 'Product not found' });
        res.json({ success: true, message: 'Product soft-deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Cập nhật tồn kho
exports.updateStock = async (req, res) => {
    try {
        const { stock_quantity } = req.body;
        const productId = req.params.id;

        if (typeof stock_quantity !== 'number' || stock_quantity < 0) {
            return res.status(400).json({ success: false, message: 'Invalid stock quantity' });
        }

        const updated = await Product.findOneAndUpdate(
            { _id: productId, isDeleted: false },
            { stock_quantity },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.json({ success: true, data: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
