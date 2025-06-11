const Joi = require('joi');

const paymentSchema = Joi.object({
    orderId: Joi.string().required().messages({
        'string.empty': 'Order ID không được bỏ trống',
        'any.required': 'Order ID là bắt buộc'
    }),
    method: Joi.string().valid('cod', 'momo', 'bank_transfer').required().messages({
        'string.empty': 'Phương thức thanh toán không được bỏ trống',
        'any.required': 'Phương thức thanh toán là bắt buộc',
        'any.only': 'Phương thức thanh toán không hợp lệ'
    }),
    transactionCode: Joi.string().optional().allow('').messages({
        'string.base': 'Mã giao dịch phải là một chuỗi'
    }),
    status: Joi.string().valid('success', 'failed', 'pending').optional().default('pending').messages({
        'string.empty': 'Trạng thái không được bỏ trống',
        'any.only': 'Trạng thái không hợp lệ'
    })
});
module.exports = { paymentSchema };