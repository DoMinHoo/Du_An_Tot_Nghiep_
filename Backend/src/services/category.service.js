    const Category = require('../models/category.model');
    const mongoose = require('mongoose');

    exports.createCategory = async (data) => {
    const category = new Category(data);
    return await category.save();
    };

    exports.updateCategory = async (id, data) => {
    return await Category.findByIdAndUpdate(id, data, { new: true });
    };

    exports.deleteCategory = async (id) => {
    return await Category.findByIdAndDelete(id);
    };

    exports.getCategoryById = async (id) => {
    return await Category.findById(id);
    };

    exports.getCategories = async (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    const categories = await Category.find()
        .sort({ order: 1 })
        .skip(skip)
        .limit(limit);
    const total = await Category.countDocuments();
    return {
        data: categories,
        total,
        page,
        limit,
    };
    };

    // Convert flat list to tree
    exports.getCategoryTree = async () => {
    const categories = await Category.find().lean();
    const map = {};
    const roots = [];

    categories.forEach(cat => {
        cat.children = [];
        map[cat._id] = cat;
    });

    categories.forEach(cat => {
        if (cat.parent) {
        map[cat.parent]?.children.push(cat);
        } else {
        roots.push(cat);
        }
    });

    return roots;
    };