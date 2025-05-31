const Joi = require('joi');

const updateUserSchema = Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/).optional(),
    address: Joi.string().min(5).optional(),
    avatarUrl: Joi.string().uri().optional(),
    dateOfBirth: Joi.date().optional(),
    gender: Joi.string().valid('male', 'female', 'other').optional(),
});

module.exports = { updateUserSchema };