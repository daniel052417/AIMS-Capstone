import Joi from 'joi';
import { ROLES } from '../constants/roles';
import { DEPARTMENTS } from '../types/department';

export const createUserSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email must be a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required'
    }),
  first_name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name must be no more than 50 characters long',
      'any.required': 'First name is required'
    }),
  last_name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name must be no more than 50 characters long',
      'any.required': 'Last name is required'
    }),
  role: Joi.string()
    .valid(...Object.values(ROLES))
    .required()
    .messages({
      'any.only': 'Role must be one of the valid roles',
      'any.required': 'Role is required'
    }),
  department: Joi.string()
    .valid(...Object.values(DEPARTMENTS))
    .optional()
    .messages({
      'any.only': 'Department must be one of the valid departments'
    })
});

export const updateUserSchema = Joi.object({
  email: Joi.string()
    .email()
    .optional()
    .messages({
      'string.email': 'Email must be a valid email address'
    }),
  first_name: Joi.string()
    .min(2)
    .max(50)
    .optional()
    .messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name must be no more than 50 characters long'
    }),
  last_name: Joi.string()
    .min(2)
    .max(50)
    .optional()
    .messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name must be no more than 50 characters long'
    }),
  role: Joi.string()
    .valid(...Object.values(ROLES))
    .optional()
    .messages({
      'any.only': 'Role must be one of the valid roles'
    }),
  department: Joi.string()
    .valid(...Object.values(DEPARTMENTS))
    .optional()
    .messages({
      'any.only': 'Department must be one of the valid departments'
    }),
  is_active: Joi.boolean()
    .optional()
});

export const userIdSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'User ID must be a valid UUID',
      'any.required': 'User ID is required'
    })
});

export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email must be a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

export const changePasswordSchema = Joi.object({
  current_password: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required'
    }),
  new_password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters long',
      'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'New password is required'
    })
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'any.required': 'Reset token is required'
    }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required'
    })
});

