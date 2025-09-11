import Joi from 'joi';
import { ROLES } from '../constants/roles';
import { PERMISSIONS } from '../constants/permissions';

export const createRoleSchema = Joi.object({
  name: Joi.string()
    .valid(...Object.values(ROLES))
    .required()
    .messages({
      'any.only': 'Role must be one of the valid roles',
      'any.required': 'Role name is required'
    }),
  description: Joi.string()
    .min(3)
    .max(255)
    .required()
    .messages({
      'string.min': 'Description must be at least 3 characters long',
      'string.max': 'Description must be no more than 255 characters long',
      'any.required': 'Description is required'
    }),
  permissions: Joi.array()
    .items(Joi.string().valid(...Object.values(PERMISSIONS)))
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one permission is required',
      'any.required': 'Permissions are required'
    })
});

export const updateRoleSchema = Joi.object({
  name: Joi.string()
    .valid(...Object.values(ROLES))
    .optional()
    .messages({
      'any.only': 'Role must be one of the valid roles'
    }),
  description: Joi.string()
    .min(3)
    .max(255)
    .optional()
    .messages({
      'string.min': 'Description must be at least 3 characters long',
      'string.max': 'Description must be no more than 255 characters long'
    }),
  permissions: Joi.array()
    .items(Joi.string().valid(...Object.values(PERMISSIONS)))
    .min(1)
    .optional()
    .messages({
      'array.min': 'At least one permission is required'
    }),
  is_active: Joi.boolean()
    .optional()
});

export const roleIdSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Role ID must be a valid UUID',
      'any.required': 'Role ID is required'
    })
});

