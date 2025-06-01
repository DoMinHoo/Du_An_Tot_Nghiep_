    const ProductVariation = require('../models/product_variations.model');

    // Tạo mới một biến thể sản phẩm
    exports.createVariation = async (req, res) => {
        try {
            const { productId } = req.params;
    
            const variation = new ProductVariation({
                ...req.body,
                productId  // Gán productId từ URL vào body
            });
    
            await variation.save();
            res.status(201).json(variation);
        } catch (err) {
            res.status(400).json({ message: 'Lỗi tạo biến thể', error: err.message });
        }
    };
    

    // Lấy danh sách biến thể theo productId
    exports.getVariationsByProductId = async (req, res) => {
        try {
            const variations = await ProductVariation.find({ productId: req.params.productId });
            res.json(variations);
        } catch (err) {
            res.status(500).json({ message: 'Lỗi truy vấn biến thể', error: err.message });
        }
    };

    // Cập nhật một biến thể sản phẩm
    exports.updateVariation = async (req, res) => {
        try {
            const updated = await ProductVariation.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!updated) return res.status(404).json({ message: 'Không tìm thấy biến thể' });
            res.json(updated);
        } catch (err) {
            res.status(400).json({ message: 'Lỗi cập nhật', error: err.message });
        }
    };

    // Xoá một biến thể sản phẩm
    exports.deleteVariation = async (req, res) => {
        try {
            const deleted = await ProductVariation.findByIdAndDelete(req.params.id);
            if (!deleted) return res.status(404).json({ message: 'Không tìm thấy biến thể để xoá' });
            res.json({ message: 'Biến thể đã được xoá' });
        } catch (err) {
            res.status(500).json({ message: 'Lỗi xoá biến thể', error: err.message });
        }
    };
