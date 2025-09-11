"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPurchasesDashboard = exports.getSupplierPerformance = exports.getPurchaseReport = exports.updateSupplier = exports.createSupplier = exports.getSupplierById = exports.getSuppliers = exports.receivePurchaseOrderItem = exports.updatePurchaseOrderItem = exports.approvePurchaseOrder = exports.updatePurchaseOrder = exports.createPurchaseOrder = exports.getPurchaseOrderById = exports.getPurchaseOrders = void 0;
const purchases_service_1 = require("../services/purchases.service");
const getPurchaseOrders = async (req, res) => {
    try {
        const filters = {
            supplier_id: req.query.supplier_id,
            status: req.query.status,
            date_from: req.query.date_from,
            date_to: req.query.date_to,
            search: req.query.search,
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 25
        };
        const result = await purchases_service_1.PurchasesService.getPurchaseOrders(filters);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Error fetching purchase orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch purchase orders'
        });
    }
};
exports.getPurchaseOrders = getPurchaseOrders;
const getPurchaseOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await purchases_service_1.PurchasesService.getPurchaseOrderById(id);
        res.json({
            success: true,
            data: order
        });
    }
    catch (error) {
        console.error('Error fetching purchase order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch purchase order'
        });
    }
};
exports.getPurchaseOrderById = getPurchaseOrderById;
const createPurchaseOrder = async (req, res) => {
    try {
        const { items, ...orderData } = req.body;
        const order = await purchases_service_1.PurchasesService.createPurchaseOrder({
            ...orderData,
            created_by_user_id: req.user?.id
        }, items);
        res.status(201).json({
            success: true,
            data: order,
            message: 'Purchase order created successfully'
        });
    }
    catch (error) {
        console.error('Error creating purchase order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create purchase order'
        });
    }
};
exports.createPurchaseOrder = createPurchaseOrder;
const updatePurchaseOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const orderData = {
            ...req.body,
            updated_at: new Date().toISOString()
        };
        const order = await purchases_service_1.PurchasesService.updatePurchaseOrder(id, orderData);
        res.json({
            success: true,
            data: order,
            message: 'Purchase order updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating purchase order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update purchase order'
        });
    }
};
exports.updatePurchaseOrder = updatePurchaseOrder;
const approvePurchaseOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const approvedByUserId = req.user?.id;
        if (!approvedByUserId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }
        const order = await purchases_service_1.PurchasesService.approvePurchaseOrder(id, approvedByUserId);
        res.json({
            success: true,
            data: order,
            message: 'Purchase order approved successfully'
        });
    }
    catch (error) {
        console.error('Error approving purchase order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve purchase order'
        });
    }
};
exports.approvePurchaseOrder = approvePurchaseOrder;
const updatePurchaseOrderItem = async (req, res) => {
    try {
        const { id } = req.params;
        const itemData = {
            ...req.body,
            updated_at: new Date().toISOString()
        };
        const item = await purchases_service_1.PurchasesService.updatePurchaseOrderItem(id, itemData);
        res.json({
            success: true,
            data: item,
            message: 'Purchase order item updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating purchase order item:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update purchase order item'
        });
    }
};
exports.updatePurchaseOrderItem = updatePurchaseOrderItem;
const receivePurchaseOrderItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity_received, received_date } = req.body;
        const item = await purchases_service_1.PurchasesService.receivePurchaseOrderItem(id, quantity_received, received_date);
        res.json({
            success: true,
            data: item,
            message: 'Purchase order item received successfully'
        });
    }
    catch (error) {
        console.error('Error receiving purchase order item:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to receive purchase order item'
        });
    }
};
exports.receivePurchaseOrderItem = receivePurchaseOrderItem;
const getSuppliers = async (req, res) => {
    try {
        const filters = {
            is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
            search: req.query.search
        };
        const suppliers = await purchases_service_1.PurchasesService.getSuppliers(filters);
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
const getSupplierById = async (req, res) => {
    try {
        const { id } = req.params;
        const supplier = await purchases_service_1.PurchasesService.getSupplierById(id);
        res.json({
            success: true,
            data: supplier
        });
    }
    catch (error) {
        console.error('Error fetching supplier:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch supplier'
        });
    }
};
exports.getSupplierById = getSupplierById;
const createSupplier = async (req, res) => {
    try {
        const supplierData = {
            ...req.body,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        const supplier = await purchases_service_1.PurchasesService.createSupplier(supplierData);
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
        const supplier = await purchases_service_1.PurchasesService.updateSupplier(id, supplierData);
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
const getPurchaseReport = async (req, res) => {
    try {
        const filters = {
            date_from: req.query.date_from,
            date_to: req.query.date_to,
            supplier_id: req.query.supplier_id
        };
        const report = await purchases_service_1.PurchasesService.getPurchaseReport(filters);
        res.json({
            success: true,
            data: report
        });
    }
    catch (error) {
        console.error('Error fetching purchase report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch purchase report'
        });
    }
};
exports.getPurchaseReport = getPurchaseReport;
const getSupplierPerformance = async (req, res) => {
    try {
        const filters = {
            date_from: req.query.date_from,
            date_to: req.query.date_to
        };
        const performance = await purchases_service_1.PurchasesService.getSupplierPerformance(filters);
        res.json({
            success: true,
            data: performance
        });
    }
    catch (error) {
        console.error('Error fetching supplier performance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch supplier performance'
        });
    }
};
exports.getSupplierPerformance = getSupplierPerformance;
const getPurchasesDashboard = async (req, res) => {
    try {
        const dashboard = await purchases_service_1.PurchasesService.getPurchasesDashboard();
        res.json({
            success: true,
            data: dashboard
        });
    }
    catch (error) {
        console.error('Error fetching purchases dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch purchases dashboard'
        });
    }
};
exports.getPurchasesDashboard = getPurchasesDashboard;
//# sourceMappingURL=purchases.controller.js.map