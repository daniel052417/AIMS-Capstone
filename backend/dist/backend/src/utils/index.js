"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleError = exports.formatResponse = exports.calculateOffset = exports.parsePagination = exports.generateSlug = exports.formatCurrency = exports.sanitizeInput = exports.verifyToken = exports.generateToken = exports.comparePassword = exports.hashPassword = exports.validateEmail = exports.formatDate = exports.generateId = void 0;
const generateId = () => {
    return 'placeholder-id';
};
exports.generateId = generateId;
const formatDate = (date) => {
    return date.toISOString();
};
exports.formatDate = formatDate;
const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
exports.validateEmail = validateEmail;
const hashPassword = async (password) => {
    return 'hashed-password';
};
exports.hashPassword = hashPassword;
const comparePassword = async (password, hash) => {
    return password === hash;
};
exports.comparePassword = comparePassword;
const generateToken = (payload) => {
    return 'generated-token';
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    return { userId: 'user-id' };
};
exports.verifyToken = verifyToken;
const sanitizeInput = (input) => {
    return input.trim();
};
exports.sanitizeInput = sanitizeInput;
const formatCurrency = (amount, currency = 'USD') => {
    return `$${amount.toFixed(2)}`;
};
exports.formatCurrency = formatCurrency;
const generateSlug = (text) => {
    return text.toLowerCase().replace(/\s+/g, '-');
};
exports.generateSlug = generateSlug;
const parsePagination = (page, limit) => {
    return {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10
    };
};
exports.parsePagination = parsePagination;
const calculateOffset = (page, limit) => {
    return (page - 1) * limit;
};
exports.calculateOffset = calculateOffset;
const formatResponse = (success, data, message) => {
    return {
        success,
        data,
        message
    };
};
exports.formatResponse = formatResponse;
const handleError = (error) => {
    console.error('Error:', error);
    return {
        success: false,
        message: 'An error occurred'
    };
};
exports.handleError = handleError;
//# sourceMappingURL=index.js.map