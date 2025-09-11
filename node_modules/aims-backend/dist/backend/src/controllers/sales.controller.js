"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSalesDashboard = exports.getCustomerSalesReport = exports.getTopSellingProducts = exports.getSalesReport = exports.updateCustomer = exports.createCustomer = exports.getCustomerById = exports.getCustomers = exports.createPayment = exports.getPayments = exports.createSalesTransaction = exports.getSalesTransactions = exports.updateOrderStatus = exports.updateSalesOrder = exports.createSalesOrder = exports.getSalesOrderById = exports.getSalesOrders = void 0;
const sales_service_1 = require("../services/sales.service");
const getSalesOrders = async (req, res) => {
    try {
        const filters = {
            customer_id: req.query.customer_id,
            status: req.query.status,
            date_from: req.query.date_from,
            date_to: req.query.date_to,
            search: req.query.search,
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 25
        };
        const result = await sales_service_1.SalesService.getSalesOrders(filters);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Error fetching sales orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sales orders'
        });
    }
};
exports.getSalesOrders = getSalesOrders;
const getSalesOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await sales_service_1.SalesService.getSalesOrderById(id);
        res.json({
            success: true,
            data: order
        });
    }
    catch (error) {
        console.error('Error fetching sales order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sales order'
        });
    }
};
exports.getSalesOrderById = getSalesOrderById;
const createSalesOrder = async (req, res) => {
    try {
        const { items, ...orderData } = req.body;
        const order = await sales_service_1.SalesService.createSalesOrder({
            ...orderData,
            created_by_user_id: req.user?.id
        }, items);
        res.status(201).json({
            success: true,
            data: order,
            message: 'Sales order created successfully'
        });
    }
    catch (error) {
        console.error('Error creating sales order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create sales order'
        });
    }
};
exports.createSalesOrder = createSalesOrder;
const updateSalesOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const orderData = {
            ...req.body,
            updated_at: new Date().toISOString()
        };
        const order = await sales_service_1.SalesService.updateSalesOrder(id, orderData);
        res.json({
            success: true,
            data: order,
            message: 'Sales order updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating sales order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update sales order'
        });
    }
};
exports.updateSalesOrder = updateSalesOrder;
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        const order = await sales_service_1.SalesService.updateOrderStatus(id, status, notes, req.user?.id);
        res.json({
            success: true,
            data: order,
            message: 'Order status updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update order status'
        });
    }
};
exports.updateOrderStatus = updateOrderStatus;
const getSalesTransactions = async (req, res) => {
    try {
        const filters = {
            customer_id: req.query.customer_id,
            payment_status: req.query.payment_status,
            date_from: req.query.date_from,
            date_to: req.query.date_to
        };
        const result = await sales_service_1.SalesService.getSalesTransactions(filters);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Error fetching sales transactions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sales transactions'
        });
    }
};
exports.getSalesTransactions = getSalesTransactions;
const createSalesTransaction = async (req, res) => {
    try {
        const transactionData = {
            ...req.body,
            created_by_user_id: req.user?.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        const transaction = await sales_service_1.SalesService.createSalesTransaction(transactionData);
        res.status(201).json({
            success: true,
            data: transaction,
            message: 'Sales transaction created successfully'
        });
    }
    catch (error) {
        console.error('Error creating sales transaction:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create sales transaction'
        });
    }
};
exports.createSalesTransaction = createSalesTransaction;
const getPayments = async (req, res) => {
    try {
        const filters = {
            transaction_id: req.query.transaction_id,
            payment_method: req.query.payment_method,
            status: req.query.status,
            date_from: req.query.date_from,
            date_to: req.query.date_to
        };
        const result = await sales_service_1.SalesService.getPayments(filters);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payments'
        });
    }
};
exports.getPayments = getPayments;
const createPayment = async (req, res) => {
    try {
        const paymentData = {
            ...req.body,
            created_at: new Date().toISOString()
        };
        const payment = await sales_service_1.SalesService.createPayment(paymentData);
        res.status(201).json({
            success: true,
            data: payment,
            message: 'Payment created successfully'
        });
    }
    catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create payment'
        });
    }
};
exports.createPayment = createPayment;
const getCustomers = async (req, res) => {
    try {
        const filters = {
            is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
            assigned_staff_id: req.query.assigned_staff_id,
            search: req.query.search,
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 25
        };
        const result = await sales_service_1.SalesService.getCustomers(filters);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch customers'
        });
    }
};
exports.getCustomers = getCustomers;
const getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await sales_service_1.SalesService.getCustomerById(id);
        res.json({
            success: true,
            data: customer
        });
    }
    catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch customer'
        });
    }
};
exports.getCustomerById = getCustomerById;
const createCustomer = async (req, res) => {
    try {
        const customerData = {
            ...req.body,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        const customer = await sales_service_1.SalesService.createCustomer(customerData);
        res.status(201).json({
            success: true,
            data: customer,
            message: 'Customer created successfully'
        });
    }
    catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create customer'
        });
    }
};
exports.createCustomer = createCustomer;
const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const customerData = {
            ...req.body,
            updated_at: new Date().toISOString()
        };
        const customer = await sales_service_1.SalesService.updateCustomer(id, customerData);
        res.json({
            success: true,
            data: customer,
            message: 'Customer updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update customer'
        });
    }
};
exports.updateCustomer = updateCustomer;
const getSalesReport = async (req, res) => {
    try {
        const filters = {
            date_from: req.query.date_from,
            date_to: req.query.date_to,
            customer_id: req.query.customer_id
        };
        const report = await sales_service_1.SalesService.getSalesReport(filters);
        res.json({
            success: true,
            data: report
        });
    }
    catch (error) {
        console.error('Error fetching sales report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sales report'
        });
    }
};
exports.getSalesReport = getSalesReport;
const getTopSellingProducts = async (req, res) => {
    try {
        const filters = {
            date_from: req.query.date_from,
            date_to: req.query.date_to,
            limit: parseInt(req.query.limit) || 10
        };
        const products = await sales_service_1.SalesService.getTopSellingProducts(filters);
        res.json({
            success: true,
            data: products
        });
    }
    catch (error) {
        console.error('Error fetching top selling products:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch top selling products'
        });
    }
};
exports.getTopSellingProducts = getTopSellingProducts;
const getCustomerSalesReport = async (req, res) => {
    try {
        const filters = {
            date_from: req.query.date_from,
            date_to: req.query.date_to,
            customer_id: req.query.customer_id
        };
        const report = await sales_service_1.SalesService.getCustomerSalesReport(filters);
        res.json({
            success: true,
            data: report
        });
    }
    catch (error) {
        console.error('Error fetching customer sales report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch customer sales report'
        });
    }
};
exports.getCustomerSalesReport = getCustomerSalesReport;
const getSalesDashboard = async (req, res) => {
    try {
        const dashboard = await sales_service_1.SalesService.getSalesDashboard();
        res.json({
            success: true,
            data: dashboard
        });
    }
    catch (error) {
        console.error('Error fetching sales dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sales dashboard'
        });
    }
};
exports.getSalesDashboard = getSalesDashboard;
//# sourceMappingURL=sales.controller.js.map