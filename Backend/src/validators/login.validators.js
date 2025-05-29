const Joi = require('joi');

const loginSchema = Joi.object({
    email: Joi.string().email().required(), // Kiểm tra email hợp lệ
    password: Joi.string().min(6).required(), // Mật khẩu tối thiểu 6 ký tự
});

module.exports = { loginSchema };
