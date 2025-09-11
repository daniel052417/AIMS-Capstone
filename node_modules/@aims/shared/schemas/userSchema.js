"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.changePasswordSchema = exports.loginSchema = exports.userIdSchema = exports.updateUserSchema = exports.createUserSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const roles_1 = require("../constants/roles");
const department_1 = require("../types/department");
exports.createUserSchema = joi_1.default.object({
    email: joi_1.default.string()
        .email()
        .required()
        .messages({
        'string.email': 'Email must be a valid email address',
        'any.required': 'Email is required'
    }),
    password: joi_1.default.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .required()
        .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'Password is required'
    }),
    first_name: joi_1.default.string()
        .min(2)
        .max(50)
        .required()
        .messages({
        'string.min': 'First name must be at least 2 characters long',
        'string.max': 'First name must be no more than 50 characters long',
        'any.required': 'First name is required'
    }),
    last_name: joi_1.default.string()
        .min(2)
        .max(50)
        .required()
        .messages({
        'string.min': 'Last name must be at least 2 characters long',
        'string.max': 'Last name must be no more than 50 characters long',
        'any.required': 'Last name is required'
    }),
    role: joi_1.default.string()
        .valid(...Object.values(roles_1.ROLES))
        .required()
        .messages({
        'any.only': 'Role must be one of the valid roles',
        'any.required': 'Role is required'
    }),
    department: joi_1.default.string()
        .valid(...Object.values(department_1.DEPARTMENTS))
        .optional()
        .messages({
        'any.only': 'Department must be one of the valid departments'
    })
});
exports.updateUserSchema = joi_1.default.object({
    email: joi_1.default.string()
        .email()
        .optional()
        .messages({
        'string.email': 'Email must be a valid email address'
    }),
    first_name: joi_1.default.string()
        .min(2)
        .max(50)
        .optional()
        .messages({
        'string.min': 'First name must be at least 2 characters long',
        'string.max': 'First name must be no more than 50 characters long'
    }),
    last_name: joi_1.default.string()
        .min(2)
        .max(50)
        .optional()
        .messages({
        'string.min': 'Last name must be at least 2 characters long',
        'string.max': 'Last name must be no more than 50 characters long'
    }),
    role: joi_1.default.string()
        .valid(...Object.values(roles_1.ROLES))
        .optional()
        .messages({
        'any.only': 'Role must be one of the valid roles'
    }),
    department: joi_1.default.string()
        .valid(...Object.values(department_1.DEPARTMENTS))
        .optional()
        .messages({
        'any.only': 'Department must be one of the valid departments'
    }),
    is_active: joi_1.default.boolean()
        .optional()
});
exports.userIdSchema = joi_1.default.object({
    id: joi_1.default.string()
        .uuid()
        .required()
        .messages({
        'string.guid': 'User ID must be a valid UUID',
        'any.required': 'User ID is required'
    })
});
exports.loginSchema = joi_1.default.object({
    email: joi_1.default.string()
        .email()
        .required()
        .messages({
        'string.email': 'Email must be a valid email address',
        'any.required': 'Email is required'
    }),
    password: joi_1.default.string()
        .required()
        .messages({
        'any.required': 'Password is required'
    })
});
exports.changePasswordSchema = joi_1.default.object({
    current_password: joi_1.default.string()
        .required()
        .messages({
        'any.required': 'Current password is required'
    }),
    new_password: joi_1.default.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .required()
        .messages({
        'string.min': 'New password must be at least 8 characters long',
        'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'New password is required'
    })
});
exports.resetPasswordSchema = joi_1.default.object({
    token: joi_1.default.string()
        .required()
        .messages({
        'any.required': 'Reset token is required'
    }),
    password: joi_1.default.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .required()
        .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'Password is required'
    })
});
//# sourceMappingURL=userSchema.js.map