// validators/bannerVisibilityValidator.js
const Joi = require('joi');

const visibilitySchema = Joi.object({
    isActive: Joi.boolean().required()
});

module.exports = visibilitySchema;
