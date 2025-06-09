const Category = require('../models/category.model');
const { createCategorySchema, updateCategorySchema } = require('../validators/categoties.validate');
const slugify = require('../untils/slugify');

// GET tất cả
const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find().populate('parentId', 'name');
        res.json(categories);
    } catch {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách danh mục' });
    }
};

// GET by ID
const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id).populate('parentId', 'name');
        if (!category) return res.status(404).json({ message: 'Không tìm thấy danh mục' });
        res.json(category);
    } catch {
        res.status(500).json({ message: 'Lỗi khi lấy danh mục' });
    }
};

// POST: Tạo mới
const createCategory = async (req, res) => {
    const { error } = createCategorySchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    const { name, description, parentId } = req.body;
    const slug = slugify(name);

    // Kiểm tra slug đã tồn tại chưa
    const exists = await Category.findOne({ slug });
    if (exists) return res.status(400).json({ message: 'Tên danh mục đã tồn tại' });

    const newCategory = new Category({ name, description, parentId, slug });
    const saved = await newCategory.save();
    res.status(201).json(saved);
};

// PUT: Cập nhật
const updateCategory = async (req, res) => {
    const { error } = updateCategorySchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { name, parentId } = req.body;

    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Không tìm thấy danh mục' });

        // Kiểm tra tên mới có trùng không (với danh mục khác)
        if (name && name !== category.name) {
            const exists = await Category.findOne({ name });
            if (exists) return res.status(400).json({ message: 'Tên danh mục đã tồn tại' });
        }

        // parentId là chính nó → không hợp lệ
        if (parentId && parentId === req.params.id) {
            return res.status(400).json({ message: 'parentId không được là chính danh mục' });
        }

        // Kiểm tra parentId tồn tại
        if (parentId && !(await Category.findById(parentId))) {
            return res.status(400).json({ message: 'parentId không tồn tại' });
        }

        const updated = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch {
        res.status(500).json({ message: 'Cập nhật danh mục thất bại' });
    }
};

// DELETE
const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Không tìm thấy danh mục' });

        // Kiểm tra nếu có danh mục con
        const hasChildren = await Category.findOne({ parentId: category._id });
        if (hasChildren) {
            return res.status(400).json({ message: 'Không thể xoá danh mục có danh mục con' });
        }

        await Category.findByIdAndDelete(req.params.id);
        res.json({ message: 'Xoá danh mục thành công' });
    } catch {
        res.status(500).json({ message: 'Xoá danh mục thất bại' });
    }
};
const getCategoriesWithChildren = async (req, res) => {
    try {
        // Lấy tất cả danh mục cha (parentId = null)
        const parents = await Category.find({ parentId: null });

        // Với mỗi danh mục cha, lấy các danh mục con
        const result = await Promise.all(parents.map(async (parent) => {
            const children = await Category.find({ parentId: parent._id });

            return {
                _id: parent._id,
                name: parent.name,
                description: parent.description,
                slug: parent.slug,
                children: children.map(child => ({
                    _id: child._id,
                    name: child.name,
                    description: child.description,
                    slug: child.slug,
                }))
            };
        }));

        res.json(result);
    } catch (err) {
        console.error('Lỗi chi tiết:', err); // 👈 Thêm dòng này để debug
        res.status(500).json({ message: 'Lỗi khi lấy danh mục', error: err.message });
    }
};
const getCategoryIdBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const category = await Category.findOne({ slug }).select("_id name slug");

        if (!category) {
            return res
                .status(404)
                .json({ success: false, message: "Danh mục không tồn tại" });
        }

        res.json({ success: true, categoryId: category._id, category });
    } catch (error) {
        res
            .status(500)
            .json({ success: false, message: "Lỗi server", error: error.message });
    }
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoriesWithChildren,
    getCategoryIdBySlug
};
