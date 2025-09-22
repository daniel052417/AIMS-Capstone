import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { SalesService } from '../services/sales.service';
import { asyncHandler } from '../middleware/errorHandler';

export class SalesController {
  /* ------------------------- SALES ORDERS ------------------------- */
  static getSalesOrders = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      customer_id,
      status,
      date_from,
      date_to,
      search,
      page = '1',
      limit = '25'
    } = req.query;

    const filters = {
      customer_id: customer_id as string,
      status: status as string,
      date_from: date_from as string,
      date_to: date_to as string,
      search: search as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    const result = await SalesService.getSalesOrders(filters);
    res.json({ success: true, data: result });
  });

  static getSalesOrderById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const order = await SalesService.getSalesOrderById(req.params.id);
    res.json({ success: true, data: order });
  });

  static createSalesOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { items, ...orderData } = req.body;
    const order = await SalesService.createSalesOrder(
      { ...orderData, created_by_user_id: req.user?.userId },
      items
    );
    res.status(201).json({ success: true, message: 'Sales order created successfully', data: order });
  });

  static updateSalesOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const orderData = { ...req.body, updated_at: new Date().toISOString() };
    const order = await SalesService.updateSalesOrder(req.params.id, orderData);
    res.json({ success: true, message: 'Sales order updated successfully', data: order });
  });

  static updateOrderStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { status, notes } = req.body;
    const order = await SalesService.updateOrderStatus(req.params.id, status, notes, req.user?.userId);
    res.json({ success: true, message: 'Order status updated successfully', data: order });
  });

  /* ---------------------- SALES TRANSACTIONS ---------------------- */
  static getSalesTransactions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      search,
      status,
      payment_status,
      payment_method,
      date_from,
      date_to,
      amount_min,
      amount_max,
      customer_id,
      staff_id,
      branch_id,
      page = '1',
      limit = '25',
      sort_by = 'transaction_date',
      sort_order = 'desc'
    } = req.query;

    const filters = {
      search: search as string,
      status: status as string,
      payment_status: payment_status as string,
      payment_method: payment_method as string,
      date_from: date_from as string,
      date_to: date_to as string,
      amount_min: amount_min ? parseFloat(amount_min as string) : undefined,
      amount_max: amount_max ? parseFloat(amount_max as string) : undefined,
      customer_id: customer_id as string,
      staff_id: staff_id as string,
      branch_id: branch_id as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sort_by: sort_by as string,
      sort_order: sort_order as 'asc' | 'desc'
    };

    const result = await SalesService.getSalesTransactions(filters);
    res.json({ success: true, data: result });
  });

  static getSalesTransactionById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const transaction = await SalesService.getSalesTransactionById(req.params.id);
    res.json({ success: true, data: transaction });
  });

  static createSalesTransaction = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const transactionData = {
      ...req.body,
      created_by_user_id: req.user?.userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const transaction = await SalesService.createSalesTransaction(transactionData);
    res.status(201).json({ success: true, message: 'Sales transaction created successfully', data: transaction });
  });

  static updateSalesTransaction = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const transactionData = req.body;
    const updatedBy = req.user!.userId;
    const result = await SalesService.updateSalesTransaction(req.params.id, transactionData, updatedBy);
    res.json({ success: true, message: 'Sales transaction updated successfully', data: result });
  });
  static updateTransactionStatus = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const transactionId = req.params.id;
      const { status, notes } = req.body;
  
      const updated = await SalesService.updateTransactionStatus(
        transactionId,
        status,
        notes,
        req.user!.userId // or whatever field you store user ID in AuthenticatedRequest
      );
  
      res.json({ success: true, data: updated });
    }
  );
  
  static deleteSalesTransaction = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { reason } = req.body;
    const deletedBy = req.user!.userId;
    await SalesService.deleteSalesTransaction(req.params.id, reason, deletedBy);
    res.json({ success: true, message: 'Sales transaction deleted successfully' });
  });
  static getSalesTransactionsStream = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      // optional filters from query (if you want to pass lastUpdated timestamp)
      const lastUpdated = req.query.last_updated as string | undefined;
  
      // call the service
      const result = await SalesService.getSalesTransactionsStream(lastUpdated);
  
      // send JSON response instead of CSV stream
      res.json({
        success: true,
        data: result.transactions,
        last_updated: result.last_updated,
      });
    }
  );
  
  

  /* --------- Bulk update / delete transactions for efficiency -------- */
  static bulkUpdateTransactionStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { transaction_ids, status, notes } = req.body;
    if (!transaction_ids || !Array.isArray(transaction_ids) || transaction_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Transaction IDs are required' });
    }
    const result = await SalesService.bulkUpdateTransactionStatus(transaction_ids, status, notes, req.user!.userId);
    res.json({ success: true, message: `${result.count} transactions updated successfully`, data: result });
  });

  static bulkDeleteTransactions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { transaction_ids, reason } = req.body;
    if (!transaction_ids || !Array.isArray(transaction_ids) || transaction_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Transaction IDs are required' });
    }
    const result = await SalesService.bulkDeleteTransactions(transaction_ids, reason, req.user!.userId);
    res.json({ success: true, message: `${result.count} transactions deleted successfully`, data: result });
  });

  /* ---------------------------- PAYMENTS ---------------------------- */
  static getPayments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const filters = {
      transaction_id: req.query.transaction_id as string,
      payment_method: req.query.payment_method as string,
      status: req.query.status as string,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string
    };
    const result = await SalesService.getPayments(filters);
    res.json({ success: true, data: result });
  });

  static createPayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const paymentData = { ...req.body, created_at: new Date().toISOString() };
    const payment = await SalesService.createPayment(paymentData);
    res.status(201).json({ success: true, message: 'Payment created successfully', data: payment });
  });

  /* --------------------------- CUSTOMERS --------------------------- */
  static getCustomers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const filters = {
      is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
      assigned_staff_id: req.query.assigned_staff_id as string,
      search: req.query.search as string,
      page: parseInt((req.query.page as string) || '1'),
      limit: parseInt((req.query.limit as string) || '25')
    };
    const result = await SalesService.getCustomers(filters);
    res.json({ success: true, data: result });
  });

  static getCustomerById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const customer = await SalesService.getCustomerById(req.params.id);
    res.json({ success: true, data: customer });
  });

  static createCustomer = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const customerData = { ...req.body, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    const customer = await SalesService.createCustomer(customerData);
    res.status(201).json({ success: true, message: 'Customer created successfully', data: customer });
  });

  static updateCustomer = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const customerData = { ...req.body, updated_at: new Date().toISOString() };
    const customer = await SalesService.updateCustomer(req.params.id, customerData);
    res.json({ success: true, message: 'Customer updated successfully', data: customer });
  });

  /* --------------------------- REPORTS --------------------------- */
  static getSalesReport = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const filters = {
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
      customer_id: req.query.customer_id as string
    };
    const report = await SalesService.getSalesReport(filters);
    res.json({ success: true, data: report });
  });

  static getTopSellingProducts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const filters = {
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
      limit: parseInt(req.query.limit as string) || 10
    };
    const products = await SalesService.getTopSellingProducts(filters);
    res.json({ success: true, data: products });
  });

  static getCustomerSalesReport = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const filters = {
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
      customer_id: req.query.customer_id as string
    };
    const report = await SalesService.getCustomerSalesReport(filters);
    res.json({ success: true, data: report });
  });

  /* -------------------------- DASHBOARD -------------------------- */
  static getSalesDashboard = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const dashboard = await SalesService.getSalesDashboard();
    res.json({ success: true, data: dashboard });
  });

  // inside SalesController class
static exportSalesTransactions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const filters = {
    date_from: req.query.date_from as string,
    date_to: req.query.date_to as string,
    status: req.query.status as string,
    payment_status: req.query.payment_status as string,
  };

  const format = (req.query.format as string) || 'csv'; // default csv

  const fileBuffer = await SalesService.exportSalesTransactions(filters, format);

  if (format === 'excel') {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="sales_transactions.xlsx"');
  } else {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sales_transactions.csv"');
  }

  res.send(fileBuffer);
});


  static printSalesTransaction = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const transactionId = req.params.id;
    // You can call a service layer if you have one
    const printable = await SalesService.generateTransactionPDF(transactionId); // implement this
    // Return JSON or HTML for print preview:
    res.json({ success: true, data: printable });
  });
}
