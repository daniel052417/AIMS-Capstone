"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductSalesReport = exports.getLowStockProducts = exports.adjustStock = exports.createInventoryMovement = exports.getInventoryMovements = exports.updateInventoryLevel = exports.getInventoryLevels = exports.deleteSupplier = exports.updateSupplier = exports.createSupplier = exports.getSuppliers = exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategories = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductById = exports.getProducts = void 0;
const products_service_1 = require("../services/products.service");
const getProducts = async (req, res) => {
    try {
        const filters = {
            category_id: req.query.category_id,
            supplier_id: req.query.supplier_id,
            is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
            search: req.query.search,
            low_stock: req.query.low_stock === 'true',
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 25
        };
        const result = await products_service_1.ProductsService.getProducts(filters);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products'
        });
    }
};
exports.getProducts = getProducts;
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await products_service_1.ProductsService.getProductById(id);
        res.json({
            success: true,
            data: product
        });
    }
    catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product'
        });
    }
};
exports.getProductById = getProductById;
const createProduct = async (req, res) => {
    try {
        const productData = {
            ...req.body,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        const product = await products_service_1.ProductsService.createProduct(productData);
        res.status(201).json({
            success: true,
            data: product,
            message: 'Product created successfully'
        });
    }
    catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create product'
        });
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const productData = {
            ...req.body,
            updated_at: new Date().toISOString()
        };
        const product = await products_service_1.ProductsService.updateProduct(id, productData);
        res.json({
            success: true,
            data: product,
            message: 'Product updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update product'
        });
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await products_service_1.ProductsService.deleteProduct(id);
        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete product'
        });
    }
};
exports.deleteProduct = deleteProduct;
const getCategories = async (req, res) => {
    try {
        const filters = {
            parent_id: req.query.parent_id === 'null' ? null : req.query.parent_id,
            is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
            search: req.query.search
        };
        const categories = await products_service_1.ProductsService.getCategories(filters);
        res.json({
            success: true,
            data: categories
        });
    }
    catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories'
        });
    }
};
exports.getCategories = getCategories;
const createCategory = async (req, res) => {
    try {
        const categoryData = {
            ...req.body,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        const category = await products_service_1.ProductsService.createCategory(categoryData);
        res.status(201).json({
            success: true,
            data: category,
            message: 'Category created successfully'
        });
    }
    catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create category'
        });
    }
};
exports.createCategory = createCategory;
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const categoryData = {
            ...req.body,
            updated_at: new Date().toISOString()
        };
        const category = await products_service_1.ProductsService.updateCategory(id, categoryData);
        res.json({
            success: true,
            data: category,
            message: 'Category updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update category'
        });
    }
};
exports.updateCategory = updateCategory;
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        await products_service_1.ProductsService.deleteCategory(id);
        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete category'
        });
    }
};
exports.deleteCategory = deleteCategory;
const getSuppliers = async (req, res) => {
    try {
        const filters = {
            is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
            search: req.query.search
        };
        const suppliers = await products_service_1.ProductsService.getSuppliers(filters);
        res.json({
            success: true,
            data: suppliers
        });
    }
    catch (error) {
        console.error('Error fetching suppliers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch suppliers'
        });
    }
};
exports.getSuppliers = getSuppliers;
const createSupplier = async (req, res) => {
    try {
        const supplierData = {
            ...req.body,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        const supplier = await products_service_1.ProductsService.createSupplier(supplierData);
        res.status(201).json({
            success: true,
            data: supplier,
            message: 'Supplier created successfully'
        });
    }
    catch (error) {
        console.error('Error creating supplier:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create supplier'
        });
    }
};
exports.createSupplier = createSupplier;
const updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const supplierData = {
            ...req.body,
            updated_at: new Date().toISOString()
        };
        const supplier = await products_service_1.ProductsService.updateSupplier(id, supplierData);
        res.json({
            success: true,
            data: supplier,
            message: 'Supplier updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating supplier:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update supplier'
        });
    }
};
exports.updateSupplier = updateSupplier;
const deleteSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        await products_service_1.ProductsService.deleteSupplier(id);
        res.json({
            success: true,
            message: 'Supplier deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting supplier:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete supplier'
        });
    }
};
exports.deleteSupplier = deleteSupplier;
const getInventoryLevels = async (req, res) => {
    try {
        const filters = {
            product_id: req.query.product_id,
            branch_id: req.query.branch_id,
            low_stock: req.query.low_stock === 'true'
        };
        const levels = await products_service_1.ProductsService.getInventoryLevels(filters);
        res.json({
            success: true,
            data: levels
        });
    }
    catch (error) {
        console.error('Error fetching inventory levels:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch inventory levels'
        });
    }
};
exports.getInventoryLevels = getInventoryLevels;
const updateInventoryLevel = async (req, res) => {
    try {
        const { id } = req.params;
        const levelData = {
            ...req.body,
            last_updated: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        const level = await products_service_1.ProductsService.updateInventoryLevel(id, levelData);
        res.json({
            success: true,
            data: level,
            message: 'Inventory level updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating inventory level:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update inventory level'
        });
    }
};
exports.updateInventoryLevel = updateInventoryLevel;
const getInventoryMovements = async (req, res) => {
    try {
        const filters = {
            product_id: req.query.product_id,
            movement_type: req.query.movement_type,
            date_from: req.query.date_from,
            date_to: req.query.date_to
        };
        const movements = await products_service_1.ProductsService.getInventoryMovements(filters);
        res.json({
            success: true,
            data: movements
        });
    }
    catch (error) {
        console.error('Error fetching inventory movements:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch inventory movements'
        });
    }
};
exports.getInventoryMovements = getInventoryMovements;
const createInventoryMovement = async (req, res) => {
    try {
        const movementData = {
            ...req.body,
            created_by_user_id: req.user?.id,
            created_at: new Date().toISOString()
        };
        const movement = await products_service_1.ProductsService.createInventoryMovement(movementData);
        res.status(201).json({
            success: true,
            data: movement,
            message: 'Inventory movement created successfully'
        });
    }
    catch (error) {
        console.error('Error creating inventory movement:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create inventory movement'
        });
    }
};
exports.createInventoryMovement = createInventoryMovement;
const adjustStock = async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity, movementType, notes } = req.body;
        const result = await products_service_1.ProductsService.adjustStock(productId, quantity, movementType, notes, req.user?.id);
        res.json({
            success: true,
            data: result,
            message: 'Stock adjusted successfully'
        });
    }
    catch (error) {
        console.error('Error adjusting stock:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to adjust stock'
        });
    }
};
exports.adjustStock = adjustStock;
const getLowStockProducts = async (req, res) => {
    try {
        const products = await products_service_1.ProductsService.getLowStockProducts();
        res.json({
            success: true,
            data: products
        });
    }
    catch (error) {
        console.error('Error fetching low stock products:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch low stock products'
        });
    }
};
exports.getLowStockProducts = getLowStockProducts;
const getProductSalesReport = async (req, res) => {
    try {
        const filters = {
            date_from: req.query.date_from,
            date_to: req.query.date_to,
            product_id: req.query.product_id
        };
        const report = await products_service_1.ProductsService.getProductSalesReport(filters);
        res.json({
            success: true,
            data: report
        });
    }
    catch (error) {
        console.error('Error fetching product sales report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product sales report'
        });
    }
};
exports.getProductSalesReport = getProductSalesReport;
//# sourceMappingURL=products.controller.js.map