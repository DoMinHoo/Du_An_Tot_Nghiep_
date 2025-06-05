// validators/bannerValidator.js
const Joi = require('joi');

const bannerSchema = Joi.object({
    title: Joi.string().max(100).required(),
    link: Joi.string().uri().allow('').default('#'),
    isActive: Joi.boolean().default(true),
    position: Joi.number().integer().min(0).default(0)
});

module.exports = bannerSchema;
