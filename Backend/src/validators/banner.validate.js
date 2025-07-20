// validators/bannerValidator.js
const Joi = require('joi');

const bannerSchema = Joi.object({
    title: Joi.string().required(),
    link: Joi.string().uri().optional(),
    collection: Joi.string(),
    isActive: Joi.boolean().optional(),
    // Không khai báo position ở đây
}).options({ allowUnknown: true });

module.exports = bannerSchema;
