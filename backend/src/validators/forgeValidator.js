const Joi = require("joi");

module.exports = Joi.object({

    product_name:
    Joi.string().required(),

    producer_name:
    Joi.string().required(),

    producer_email:
    Joi.string()
    .email()
    .required(),

    lot_number:
    Joi.string().required(),

    quantity_declared:
    Joi.number()
    .integer()
    .min(1)
    .required(),

    technical_description:
    Joi.string()
    .allow("")
    .optional(),

    standard_reference:
    Joi.string()
    .allow("")
    .optional(),

    origin_country:
    Joi.string()
    .allow("")
    .optional(),

    certificate_date:
    Joi.string()
    .allow("")
    .optional(),

    production_date:
    Joi.string()
    .allow("")
    .optional(),

    expiration_date:
    Joi.string()
    .allow("")
    .optional(),

    weight_volume:
    Joi.string()
    .allow("")
    .optional(),

    packaging_characteristics:
    Joi.string()
    .allow("")
    .optional()

}).unknown(true);