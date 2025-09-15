import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { PurchasesService } from '../services/purchases.service';

// Purchase Orders
export const getPurchaseOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const filters = {
      supplier_id: req.query.supplier_id as string,
      status: req.query.status as string,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
      search: req.query.search as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 25,
    };

    const result = await PurchasesService.getPurchaseOrders(filters);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase orders',
    });
  }
};

export const getPurchaseOrderById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const order = await PurchasesService.getPurchaseOrderById(id);
    
    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase order',
    });
  }
};

export const createPurchaseOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { items, ...orderData } = req.body;
    
    const order = await PurchasesService.createPurchaseOrder({
      ...orderData,
      created_by_user_id: req.user?.id,
    }, items);
    
    res.status(201).json({
      success: true,
      data: order,
      message: 'Purchase order created successfully',
    });
  } catch (error) {
    console.error('Error creating purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create purchase order',
    });
  }
};

export const updatePurchaseOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const orderData = {
      ...req.body,
      updated_at: new Date().toISOString(),
    };

    const order = await PurchasesService.updatePurchaseOrder(id, orderData);
    
    res.json({
      success: true,
      data: order,
      message: 'Purchase order updated successfully',
    });
  } catch (error) {
    console.error('Error updating purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update purchase order',
    });
  }
};

export const approvePurchaseOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const approvedByUserId = req.user?.id;

    if (!approvedByUserId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const order = await PurchasesService.approvePurchaseOrder(id, approvedByUserId);
    
    res.json({
      success: true,
      data: order,
      message: 'Purchase order approved successfully',
    });
  } catch (error) {
    console.error('Error approving purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve purchase order',
    });
  }
};

// Purchase Order Items
export const updatePurchaseOrderItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const itemData = {
      ...req.body,
      updated_at: new Date().toISOString(),
    };

    const item = await PurchasesService.updatePurchaseOrderItem(id, itemData);
    
    res.json({
      success: true,
      data: item,
      message: 'Purchase order item updated successfully',
    });
  } catch (error) {
    console.error('Error updating purchase order item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update purchase order item',
    });
  }
};

export const receivePurchaseOrderItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { quantity_received, received_date } = req.body;

    const item = await PurchasesService.receivePurchaseOrderItem(
      id, 
      quantity_received, 
      received_date,
    );
    
    res.json({
      success: true,
      data: item,
      message: 'Purchase order item received successfully',
    });
  } catch (error) {
    console.error('Error receiving purchase order item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to receive purchase order item',
    });
  }
};

// Supplier Management
export const getSuppliers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const filters = {
      is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
      search: req.query.search as string,
    };

    const suppliers = await PurchasesService.getSuppliers(filters);
    
    res.json({
      success: true,
      data: suppliers,
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch suppliers',
    });
  }
};

export const getSupplierById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const supplier = await PurchasesService.getSupplierById(id);
    
    res.json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supplier',
    });
  }
};

export const createSupplier = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const supplierData = {
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const supplier = await PurchasesService.createSupplier(supplierData);
    
    res.status(201).json({
      success: true,
      data: supplier,
      message: 'Supplier created successfully',
    });
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create supplier',
    });
  }
};

export const updateSupplier = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const supplierData = {
      ...req.body,
      updated_at: new Date().toISOString(),
    };

    const supplier = await PurchasesService.updateSupplier(id, supplierData);
    
    res.json({
      success: true,
      data: supplier,
      message: 'Supplier updated successfully',
    });
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update supplier',
    });
  }
};

// Reports
export const getPurchaseReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const filters = {
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
      supplier_id: req.query.supplier_id as string,
    };

    const report = await PurchasesService.getPurchaseReport(filters);
    
    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error fetching purchase report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase report',
    });
  }
};

export const getSupplierPerformance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const filters = {
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
    };

    const performance = await PurchasesService.getSupplierPerformance(filters);
    
    res.json({
      success: true,
      data: performance,
    });
  } catch (error) {
    console.error('Error fetching supplier performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supplier performance',
    });
  }
};

// Dashboard
export const getPurchasesDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const dashboard = await PurchasesService.getPurchasesDashboard();
    
    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error('Error fetching purchases dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchases dashboard',
    });
  }
};

