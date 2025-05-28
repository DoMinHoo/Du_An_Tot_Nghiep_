const Joi = require('joi');

const registerSchema = Joi.object({
    name: Joi.string().min(3).max(30).required(),
    address: Joi.string().min(5).required(),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/).required(), // Kiểm tra số điện thoại hợp lệ
    email: Joi.string().email().required(), // Kiểm tra email hợp lệ
    password: Joi.string().min(6).required(), // Mật khẩu tối thiểu 6 ký tự
    dateBirth: Joi.date().less('now').required(), // Kiểm tra ngày sinh hợp lệ
    gender: Joi.string().valid('male', 'female', 'other').required(),
    status: Joi.string().valid('active', 'banned').default('active'),
    avatarUrl: Joi.string().uri().optional(),
    roleId: Joi.string().required(), // roleId là ObjectId dạng chuỗi
});

module.exports = { registerSchema };
