const Joi = require('joi');
const mongoose = require("mongoose"); // ✅ thêm dòng này

const updateUserSchema = Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/).optional(),
    address: Joi.string().min(5).optional(),
    avatarUrl: Joi.string().uri().optional(),
    dateBirth: Joi.date().iso(), // 👈 thêm
    status: Joi.string().valid("active", "inactive"), // 👈 thêm
    gender: Joi.string().valid('male', 'female', 'other').optional(),
    roleId: Joi.string().custom((value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            return helpers.error("any.invalid");
        }
        return value;
    }, "ObjectId Validation"),
});

module.exports = { updateUserSchema };