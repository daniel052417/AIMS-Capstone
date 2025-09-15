import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { SalesService } from '../services/sales.service';

// Sales Orders
export const getSalesOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const filters = {
      customer_id: req.query.customer_id as string,
      status: req.query.status as string,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
      search: req.query.search as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 25,
    };

    const result = await SalesService.getSalesOrders(filters);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching sales orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales orders',
    });
  }
};

export const getSalesOrderById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const order = await SalesService.getSalesOrderById(id);
    
    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error fetching sales order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales order',
    });
  }
};

export const createSalesOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { items, ...orderData } = req.body;
    
    const order = await SalesService.createSalesOrder({
      ...orderData,
      created_by_user_id: req.user?.id,
    }, items);
    
    res.status(201).json({
      success: true,
      data: order,
      message: 'Sales order created successfully',
    });
  } catch (error) {
    console.error('Error creating sales order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create sales order',
    });
  }
};

export const updateSalesOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const orderData = {
      ...req.body,
      updated_at: new Date().toISOString(),
    };

    const order = await SalesService.updateSalesOrder(id, orderData);
    
    res.json({
      success: true,
      data: order,
      message: 'Sales order updated successfully',
    });
  } catch (error) {
    console.error('Error updating sales order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update sales order',
    });
  }
};

export const updateOrderStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const order = await SalesService.updateOrderStatus(id, status, notes, req.user?.id);
    
    res.json({
      success: true,
      data: order,
      message: 'Order status updated successfully',
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
    });
  }
};

// Sales Transactions
export const getSalesTransactions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const filters = {
      customer_id: req.query.customer_id as string,
      payment_status: req.query.payment_status as string,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
    };

    const result = await SalesService.getSalesTransactions(filters);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching sales transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales transactions',
    });
  }
};

export const createSalesTransaction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const transactionData = {
      ...req.body,
      created_by_user_id: req.user?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const transaction = await SalesService.createSalesTransaction(transactionData);
    
    res.status(201).json({
      success: true,
      data: transaction,
      message: 'Sales transaction created successfully',
    });
  } catch (error) {
    console.error('Error creating sales transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create sales transaction',
    });
  }
};

// Payments
export const getPayments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const filters = {
      transaction_id: req.query.transaction_id as string,
      payment_method: req.query.payment_method as string,
      status: req.query.status as string,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
    };

    const result = await SalesService.getPayments(filters);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
    });
  }
};

export const createPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const paymentData = {
      ...req.body,
      created_at: new Date().toISOString(),
    };

    const payment = await SalesService.createPayment(paymentData);
    
    res.status(201).json({
      success: true,
      data: payment,
      message: 'Payment created successfully',
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment',
    });
  }
};

// Customer Management
export const getCustomers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const filters = {
      is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
      assigned_staff_id: req.query.assigned_staff_id as string,
      search: req.query.search as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 25,
    };

    const result = await SalesService.getCustomers(filters);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
    });
  }
};

export const getCustomerById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const customer = await SalesService.getCustomerById(id);
    
    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer',
    });
  }
};

export const createCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const customerData = {
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const customer = await SalesService.createCustomer(customerData);
    
    res.status(201).json({
      success: true,
      data: customer,
      message: 'Customer created successfully',
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create customer',
    });
  }
};

export const updateCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const customerData = {
      ...req.body,
      updated_at: new Date().toISOString(),
    };

    const customer = await SalesService.updateCustomer(id, customerData);
    
    res.json({
      success: true,
      data: customer,
      message: 'Customer updated successfully',
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update customer',
    });
  }
};

// Reports
export const getSalesReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const filters = {
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
      customer_id: req.query.customer_id as string,
    };

    const report = await SalesService.getSalesReport(filters);
    
    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error fetching sales report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales report',
    });
  }
};

export const getTopSellingProducts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const filters = {
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
      limit: parseInt(req.query.limit as string) || 10,
    };

    const products = await SalesService.getTopSellingProducts(filters);
    
    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Error fetching top selling products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top selling products',
    });
  }
};

export const getCustomerSalesReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const filters = {
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
      customer_id: req.query.customer_id as string,
    };

    const report = await SalesService.getCustomerSalesReport(filters);
    
    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error fetching customer sales report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer sales report',
    });
  }
};

// Dashboard
export const getSalesDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const dashboard = await SalesService.getSalesDashboard();
    
    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error('Error fetching sales dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales dashboard',
    });
  }
};

