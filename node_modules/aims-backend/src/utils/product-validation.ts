import Joi from 'joi';

export const productValidation = {
  create: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Product name must be at least 2 characters long',
        'string.max': 'Product name must not exceed 100 characters',
        'any.required': 'Product name is required'
      }),
    description: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.max': 'Description must not exceed 500 characters'
      }),
    sku: Joi.string()
      .min(3)
      .max(50)
      .required()
      .messages({
        'string.min': 'SKU must be at least 3 characters long',
        'string.max': 'SKU must not exceed 50 characters',
        'any.required': 'SKU is required'
      }),
    barcode: Joi.string()
      .min(8)
      .max(20)
      .optional()
      .messages({
        'string.min': 'Barcode must be at least 8 characters long',
        'string.max': 'Barcode must not exceed 20 characters'
      }),
    category_id: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.guid': 'Please provide a valid category ID',
        'any.required': 'Category ID is required'
      }),
    unit_of_measure_id: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.guid': 'Please provide a valid unit of measure ID',
        'any.required': 'Unit of measure ID is required'
      }),
    purchase_price: Joi.number()
      .positive()
      .precision(2)
      .required()
      .messages({
        'number.positive': 'Purchase price must be positive',
        'any.required': 'Purchase price is required'
      }),
    selling_price: Joi.number()
      .positive()
      .precision(2)
      .required()
      .messages({
        'number.positive': 'Selling price must be positive',
        'any.required': 'Selling price is required'
      }),
    min_stock_level: Joi.number()
      .min(0)
      .required()
      .messages({
        'number.min': 'Minimum stock level must be 0 or greater',
        'any.required': 'Minimum stock level is required'
      }),
    max_stock_level: Joi.number()
      .min(0)
      .required()
      .messages({
        'number.min': 'Maximum stock level must be 0 or greater',
        'any.required': 'Maximum stock level is required'
      }),
    branch_id: Joi.string()
      .uuid()
      .optional()
      .messages({
        'string.guid': 'Please provide a valid branch ID'
      })
  }),

  update: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .optional(),
    description: Joi.string()
      .max(500)
      .optional(),
    sku: Joi.string()
      .min(3)
      .max(50)
      .optional(),
    barcode: Joi.string()
      .min(8)
      .max(20)
      .optional(),
    category_id: Joi.string()
      .uuid()
      .optional(),
    unit_of_measure_id: Joi.string()
      .uuid()
      .optional(),
    purchase_price: Joi.number()
      .positive()
      .precision(2)
      .optional(),
    selling_price: Joi.number()
      .positive()
      .precision(2)
      .optional(),
    min_stock_level: Joi.number()
      .min(0)
      .optional(),
    max_stock_level: Joi.number()
      .min(0)
      .optional(),
    is_active: Joi.boolean()
      .optional()
  }),

  variant: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Variant name must be at least 2 characters long',
        'string.max': 'Variant name must not exceed 100 characters',
        'any.required': 'Variant name is required'
      }),
    sku: Joi.string()
      .min(3)
      .max(50)
      .required()
      .messages({
        'string.min': 'Variant SKU must be at least 3 characters long',
        'string.max': 'Variant SKU must not exceed 50 characters',
        'any.required': 'Variant SKU is required'
      }),
    barcode: Joi.string()
      .min(8)
      .max(20)
      .optional(),
    price_modifier: Joi.number()
      .precision(2)
      .required()
      .messages({
        'any.required': 'Price modifier is required'
      })
  })
};