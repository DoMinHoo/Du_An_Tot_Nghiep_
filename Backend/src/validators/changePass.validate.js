const Joi = require('joi');

const changePasswordSchema = Joi.object({
    oldPassword: Joi.string().min(6).required().messages({
        'string.base': 'Mật khẩu cũ phải là chuỗi',
        'string.min': 'Mật khẩu cũ phải có ít nhất 6 ký tự',
        'any.required': 'Mật khẩu cũ là bắt buộc',
    }),
    newPassword: Joi.string().min(6).required().messages({
        'string.base': 'Mật khẩu mới phải là chuỗi',
        'string.min': 'Mật khẩu mới phải có ít nhất 6 ký tự',
        'any.required': 'Mật khẩu mới là bắt buộc',
    }),
});

module.exports = { changePasswordSchema };