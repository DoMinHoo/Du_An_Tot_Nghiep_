const Joi = require('joi');
const mongoose = require('mongoose');

const objectIdValidator = (value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
    }
    return value;
};

const createCategorySchema = Joi.object({
    name: Joi.string().min(2).required().messages({
        'any.required': 'Tên danh mục là bắt buộc',
        'string.min': 'Tên danh mục phải có ít nhất 2 ký tự'
    }),
    description: Joi.string().allow('').optional(),
    parentId: Joi.string().custom(objectIdValidator).allow(null, '').optional(),
});

const updateCategorySchema = Joi.object({
    name: Joi.string().min(2).optional(),
    description: Joi.string().allow('').optional(),
    parentId: Joi.string().custom(objectIdValidator).allow(null, '').optional(),
});

module.exports = {
    createCategorySchema,
    updateCategorySchema
};
