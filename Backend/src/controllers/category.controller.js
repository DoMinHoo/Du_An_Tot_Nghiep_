    const categoryService = require('../services/category.service');

    //them danh muc
    exports.create = async (req, res) => {
    try {
        const result = await categoryService.createCategory(req.body);
        res.status(201).json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
    }; 
    //cap nhat danh muc
    exports.update = async (req, res) => {
    try {
        const result = await categoryService.updateCategory(req.params.id, req.body);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
    };
    //xoa danh muc
        exports.remove = async (req, res) => {
            try {
            await categoryService.deleteCategory(req.params.id);
            res.sendStatus(204); // Trả về 204 No Content
            } catch (err) {
            res.status(400).json({ error: err.message });
            }
        };
    //lay danh sach
    exports.getAll = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    try {
        const result = await categoryService.getCategories(Number(page), Number(limit));
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
    };
    //lay danh muc 
    exports.getTree = async (req, res) => {
    try {
        const tree = await categoryService.getCategoryTree();
        res.json(tree);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
    };
