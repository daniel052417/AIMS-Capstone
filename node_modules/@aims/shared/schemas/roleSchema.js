"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleIdSchema = exports.updateRoleSchema = exports.createRoleSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const roles_1 = require("../constants/roles");
const permissions_1 = require("../constants/permissions");
exports.createRoleSchema = joi_1.default.object({
    name: joi_1.default.string()
        .valid(...Object.values(roles_1.ROLES))
        .required()
        .messages({
        'any.only': 'Role must be one of the valid roles',
        'any.required': 'Role name is required'
    }),
    description: joi_1.default.string()
        .min(3)
        .max(255)
        .required()
        .messages({
        'string.min': 'Description must be at least 3 characters long',
        'string.max': 'Description must be no more than 255 characters long',
        'any.required': 'Description is required'
    }),
    permissions: joi_1.default.array()
        .items(joi_1.default.string().valid(...Object.values(permissions_1.PERMISSIONS)))
        .min(1)
        .required()
        .messages({
        'array.min': 'At least one permission is required',
        'any.required': 'Permissions are required'
    })
});
exports.updateRoleSchema = joi_1.default.object({
    name: joi_1.default.string()
        .valid(...Object.values(roles_1.ROLES))
        .optional()
        .messages({
        'any.only': 'Role must be one of the valid roles'
    }),
    description: joi_1.default.string()
        .min(3)
        .max(255)
        .optional()
        .messages({
        'string.min': 'Description must be at least 3 characters long',
        'string.max': 'Description must be no more than 255 characters long'
    }),
    permissions: joi_1.default.array()
        .items(joi_1.default.string().valid(...Object.values(permissions_1.PERMISSIONS)))
        .min(1)
        .optional()
        .messages({
        'array.min': 'At least one permission is required'
    }),
    is_active: joi_1.default.boolean()
        .optional()
});
exports.roleIdSchema = joi_1.default.object({
    id: joi_1.default.string()
        .uuid()
        .required()
        .messages({
        'string.guid': 'Role ID must be a valid UUID',
        'any.required': 'Role ID is required'
    })
});
//# sourceMappingURL=roleSchema.js.map