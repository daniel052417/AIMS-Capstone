"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateObject = exports.validateArray = exports.validateEnum = exports.validateRange = exports.validateMaxLength = exports.validateMinLength = exports.validateRequired = exports.sanitizeString = exports.isValidURL = exports.isValidDate = exports.isValidUUID = exports.isValidPhoneNumber = exports.isValidPassword = exports.isValidEmail = void 0;
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;
const isValidPassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};
exports.isValidPassword = isValidPassword;
const isValidPhoneNumber = (phone) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
};
exports.isValidPhoneNumber = isValidPhoneNumber;
const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};
exports.isValidUUID = isValidUUID;
const isValidDate = (date) => {
    const dateObj = new Date(date);
    return dateObj instanceof Date && !isNaN(dateObj.getTime());
};
exports.isValidDate = isValidDate;
const isValidURL = (url) => {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
};
exports.isValidURL = isValidURL;
const sanitizeString = (str) => {
    return str.trim().replace(/[<>]/g, '');
};
exports.sanitizeString = sanitizeString;
const validateRequired = (value, fieldName) => {
    if (value === undefined || value === null || value === '') {
        throw new Error(`${fieldName} is required`);
    }
};
exports.validateRequired = validateRequired;
const validateMinLength = (value, minLength, fieldName) => {
    if (value.length < minLength) {
        throw new Error(`${fieldName} must be at least ${minLength} characters long`);
    }
};
exports.validateMinLength = validateMinLength;
const validateMaxLength = (value, maxLength, fieldName) => {
    if (value.length > maxLength) {
        throw new Error(`${fieldName} must be no more than ${maxLength} characters long`);
    }
};
exports.validateMaxLength = validateMaxLength;
const validateRange = (value, min, max, fieldName) => {
    if (value < min || value > max) {
        throw new Error(`${fieldName} must be between ${min} and ${max}`);
    }
};
exports.validateRange = validateRange;
const validateEnum = (value, allowedValues, fieldName) => {
    if (!allowedValues.includes(value)) {
        throw new Error(`${fieldName} must be one of: ${allowedValues.join(', ')}`);
    }
};
exports.validateEnum = validateEnum;
const validateArray = (value, fieldName) => {
    if (!Array.isArray(value)) {
        throw new Error(`${fieldName} must be an array`);
    }
};
exports.validateArray = validateArray;
const validateObject = (value, fieldName) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new Error(`${fieldName} must be an object`);
    }
};
exports.validateObject = validateObject;
//# sourceMappingURL=validators.js.map