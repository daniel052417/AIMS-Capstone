# All Sales Records Backend Integration Guide

## Overview
This guide provides a complete backend implementation for the AllSalesRecords module, including enhanced database queries, API endpoints, and frontend integration steps for comprehensive sales transaction management.

## Table of Contents
1. [Database Schema & Migrations](#database-schema--migrations)
2. [API Endpoints & Routes](#api-endpoints--routes)
3. [Controllers & Services](#controllers--services)
4. [Export & Reporting](#export--reporting)
5. [Real-time Updates](#real-time-updates)
6. [Frontend Integration](#frontend-integration)
7. [Implementation Steps](#implementation-steps)

---

## Database Schema & Migrations

### Enhanced Sales Transactions View

```sql
-- Create enhanced view for sales transactions with all related data
CREATE OR REPLACE VIEW sales_transactions_enhanced AS
SELECT 
    st.id,
    st.transaction_number,
    st.customer_id,
    st.staff_id,
    st.branch_id,
    st.transaction_date,
    st.total_amount,
    st.payment_status,
    st.status,
    st.notes,
    st.created_at,
    st.updated_at,
    st.created_by_user_id,
    
    -- Customer information
    c.first_name as customer_first_name,
    c.last_name as customer_last_name,
    c.email as customer_email,
    c.phone as customer_phone,
    CONCAT(c.first_name, ' ', c.last_name) as customer_name,
    
    -- Staff information
    s.first_name as staff_first_name,
    s.last_name as staff_last_name,
    CONCAT(s.first_name, ' ', s.last_name) as staff_name,
    
    -- Branch information
    b.name as branch_name,
    b.city as branch_city,
    
    -- Payment information
    p.payment_method,
    p.amount as payment_amount,
    p.payment_date,
    p.status as payment_status_detail,
    
    -- Items count
    (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = st.id) as items_count,
    
    -- Total items quantity
    (SELECT COALESCE(SUM(oi.quantity), 0) FROM order_items oi WHERE oi.order_id = st.id) as total_quantity

FROM sales_transactions st
LEFT JOIN customers c ON st.customer_id = c.id
LEFT JOIN staff s ON st.staff_id = s.id
LEFT JOIN branches b ON st.branch_id = b.id
LEFT JOIN payments p ON st.id = p.sales_transaction_id;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_sales_transactions_enhanced_date ON sales_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_enhanced_customer ON sales_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_enhanced_status ON sales_transactions(status);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_enhanced_payment_status ON sales_transactions(payment_status);
```

### Audit Logging for Sales Operations

```sql
-- Function to log sales transaction changes
CREATE OR REPLACE FUNCTION log_sales_transaction_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the change
    INSERT INTO audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values,
        created_at
    ) VALUES (
        COALESCE(NEW.updated_by_user_id, NEW.created_by_user_id),
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'sales_transaction_created'
            WHEN TG_OP = 'UPDATE' THEN 'sales_transaction_updated'
            WHEN TG_OP = 'DELETE' THEN 'sales_transaction_deleted'
        END,
        'sales_transaction',
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
        NOW()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER sales_transaction_audit
    AFTER INSERT OR UPDATE OR DELETE ON sales_transactions
    FOR EACH ROW
    EXECUTE FUNCTION log_sales_transaction_change();
```

### Bulk Operations Support

```sql
-- Function to bulk update sales transaction status
CREATE OR REPLACE FUNCTION bulk_update_sales_transactions(
    p_transaction_ids UUID[],
    p_status VARCHAR(50),
    p_updated_by_user_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Update transactions
    UPDATE sales_transactions 
    SET 
        status = p_status,
        updated_by_user_id = p_updated_by_user_id,
        updated_at = NOW()
    WHERE id = ANY(p_transaction_ids);
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    -- Log bulk update
    INSERT INTO audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        new_values,
        created_at
    ) VALUES (
        p_updated_by_user_id,
        'bulk_sales_transaction_update',
        'sales_transaction',
        p_transaction_ids[1], -- Use first ID as representative
        jsonb_build_object(
            'transaction_ids', p_transaction_ids,
            'status', p_status,
            'notes', p_notes,
            'count', updated_count
        ),
        NOW()
    );
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to bulk delete sales transactions (soft delete)
CREATE OR REPLACE FUNCTION bulk_delete_sales_transactions(
    p_transaction_ids UUID[],
    p_deleted_by_user_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Soft delete transactions
    UPDATE sales_transactions 
    SET 
        is_deleted = true,
        deleted_at = NOW(),
        deleted_by_user_id = p_deleted_by_user_id,
        deletion_reason = p_reason
    WHERE id = ANY(p_transaction_ids);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log bulk deletion
    INSERT INTO audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        new_values,
        created_at
    ) VALUES (
        p_deleted_by_user_id,
        'bulk_sales_transaction_delete',
        'sales_transaction',
        p_transaction_ids[1], -- Use first ID as representative
        jsonb_build_object(
            'transaction_ids', p_transaction_ids,
            'reason', p_reason,
            'count', deleted_count
        ),
        NOW()
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
```

---

## API Endpoints & Routes

### Enhanced Route File: `backend/src/routes/sales.routes.ts`

```typescript
import { Router } from 'express';
import { authenticateToken, requireRole, requirePermission } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import * as salesController from '../controllers/sales.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Enhanced Sales Transactions Routes
router.get('/transactions', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff', 'pos_cashier']), 
  requirePermission('sales.read'),
  asyncHandler(salesController.getSalesTransactions)
);

router.get('/transactions/:id', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff', 'pos_cashier']), 
  requirePermission('sales.read'),
  asyncHandler(salesController.getSalesTransactionById)
);

router.put('/transactions/:id', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff']), 
  requirePermission('sales.update'),
  asyncHandler(salesController.updateSalesTransaction)
);

router.delete('/transactions/:id', 
  requireRole(['super_admin', 'sales_admin']), 
  requirePermission('sales.delete'),
  asyncHandler(salesController.deleteSalesTransaction)
);

// Bulk Operations
router.put('/transactions/bulk/status', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff']), 
  requirePermission('sales.update'),
  asyncHandler(salesController.bulkUpdateTransactionStatus)
);

router.delete('/transactions/bulk', 
  requireRole(['super_admin', 'sales_admin']), 
  requirePermission('sales.delete'),
  asyncHandler(salesController.bulkDeleteTransactions)
);

// Export and Reports
router.get('/transactions/export', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff']), 
  requirePermission('sales.export'),
  asyncHandler(salesController.exportSalesTransactions)
);

router.get('/transactions/print/:id', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff', 'pos_cashier']), 
  requirePermission('sales.read'),
  asyncHandler(salesController.printSalesTransaction)
);

// Real-time Updates
router.get('/transactions/stream', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff']), 
  requirePermission('sales.read'),
  asyncHandler(salesController.getSalesTransactionsStream)
);

// Status Management
router.put('/transactions/:id/status', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff']), 
  requirePermission('sales.update'),
  asyncHandler(salesController.updateTransactionStatus)
);

// Existing routes...
router.get('/orders', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff', 'pos_cashier']), 
  asyncHandler(salesController.getSalesOrders)
);

// ... (other existing routes)

export default router;
```

---

## Controllers & Services

### Enhanced Controller: `backend/src/controllers/sales.controller.ts`

```typescript
import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { SalesService } from '../services/sales.service';
import { asyncHandler } from '../middleware/errorHandler';

export class SalesController {
  // Get sales transactions with enhanced filtering
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
      page = 1,
      limit = 25,
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
    
    res.json({
      success: true,
      data: result
    });
  });

  // Get specific sales transaction with full details
  static getSalesTransactionById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    const transaction = await SalesService.getSalesTransactionById(id);
    
    res.json({
      success: true,
      data: transaction
    });
  });

  // Update sales transaction
  static updateSalesTransaction = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const transactionData = req.body;
    const updatedBy = req.user!.userId;

    const result = await SalesService.updateSalesTransaction(id, transactionData, updatedBy);
    
    res.json({
      success: true,
      message: 'Sales transaction updated successfully',
      data: result
    });
  });

  // Delete sales transaction (soft delete)
  static deleteSalesTransaction = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    const deletedBy = req.user!.userId;

    await SalesService.deleteSalesTransaction(id, reason, deletedBy);
    
    res.json({
      success: true,
      message: 'Sales transaction deleted successfully'
    });
  });

  // Bulk update transaction status
  static bulkUpdateTransactionStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { transaction_ids, status, notes } = req.body;
    const updatedBy = req.user!.userId;

    if (!transaction_ids || !Array.isArray(transaction_ids) || transaction_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Transaction IDs are required'
      });
    }

    const result = await SalesService.bulkUpdateTransactionStatus(transaction_ids, status, notes, updatedBy);
    
    res.json({
      success: true,
      message: `${result.count} transactions updated successfully`,
      data: result
    });
  });

  // Bulk delete transactions
  static bulkDeleteTransactions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { transaction_ids, reason } = req.body;
    const deletedBy = req.user!.userId;

    if (!transaction_ids || !Array.isArray(transaction_ids) || transaction_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Transaction IDs are required'
      });
    }

    const result = await SalesService.bulkDeleteTransactions(transaction_ids, reason, deletedBy);
    
    res.json({
      success: true,
      message: `${result.count} transactions deleted successfully`,
      data: result
    });
  });

  // Export sales transactions
  static exportSalesTransactions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      format = 'csv',
      date_from,
      date_to,
      status,
      payment_status,
      customer_id,
      staff_id,
      branch_id
    } = req.query;

    const filters = {
      date_from: date_from as string,
      date_to: date_to as string,
      status: status as string,
      payment_status: payment_status as string,
      customer_id: customer_id as string,
      staff_id: staff_id as string,
      branch_id: branch_id as string
    };

    const result = await SalesService.exportSalesTransactions(filters, format as string);
    
    res.setHeader('Content-Type', format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="sales_transactions_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}"`);
    
    res.send(result);
  });

  // Print sales transaction
  static printSalesTransaction = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    const result = await SalesService.generateTransactionPDF(id);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="transaction_${id}.pdf"`);
    
    res.send(result);
  });

  // Get real-time sales transactions stream
  static getSalesTransactionsStream = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { last_updated } = req.query;
    
    const result = await SalesService.getSalesTransactionsStream(last_updated as string);
    
    res.json({
      success: true,
      data: result
    });
  });

  // Update transaction status
  static updateTransactionStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { status, notes } = req.body;
    const updatedBy = req.user!.userId;

    const result = await SalesService.updateTransactionStatus(id, status, notes, updatedBy);
    
    res.json({
      success: true,
      message: 'Transaction status updated successfully',
      data: result
    });
  });

  // ... (existing controller methods)
}
```

### Enhanced Service: `backend/src/services/sales.service.ts`

```typescript
import { supabaseAdmin } from '../config/supabaseClient';
import { ExportService } from '../services/export.service';
import { PDFService } from '../services/pdf.service';

export interface SalesTransactionFilters {
  search?: string;
  status?: string;
  payment_status?: string;
  payment_method?: string;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  customer_id?: string;
  staff_id?: string;
  branch_id?: string;
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export class SalesService {
  // Get sales transactions with enhanced filtering and joins
  static async getSalesTransactions(filters: SalesTransactionFilters) {
    try {
      let query = supabaseAdmin
        .from('sales_transactions_enhanced')
        .select('*');

      // Apply filters
      if (filters.search) {
        query = query.or(`
          transaction_number.ilike.%${filters.search}%,
          customer_name.ilike.%${filters.search}%,
          customer_email.ilike.%${filters.search}%,
          staff_name.ilike.%${filters.search}%
        `);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.payment_status) {
        query = query.eq('payment_status', filters.payment_status);
      }
      if (filters.payment_method) {
        query = query.eq('payment_method', filters.payment_method);
      }
      if (filters.date_from) {
        query = query.gte('transaction_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('transaction_date', filters.date_to);
      }
      if (filters.amount_min !== undefined) {
        query = query.gte('total_amount', filters.amount_min);
      }
      if (filters.amount_max !== undefined) {
        query = query.lte('total_amount', filters.amount_max);
      }
      if (filters.customer_id) {
        query = query.eq('customer_id', filters.customer_id);
      }
      if (filters.staff_id) {
        query = query.eq('staff_id', filters.staff_id);
      }
      if (filters.branch_id) {
        query = query.eq('branch_id', filters.branch_id);
      }

      // Apply sorting
      const sortColumn = filters.sort_by || 'transaction_date';
      const sortOrder = filters.sort_order || 'desc';
      query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const from = (filters.page - 1) * filters.limit;
      const to = from + filters.limit - 1;
      query = query.range(from, to);

      const { data: transactions, error, count } = await query;

      if (error) throw error;

      return {
        transactions: transactions || [],
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / filters.limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch sales transactions: ${error}`);
    }
  }

  // Get specific sales transaction with full details
  static async getSalesTransactionById(id: string) {
    try {
      const { data: transaction, error } = await supabaseAdmin
        .from('sales_transactions')
        .select(`
          *,
          customer:customer_id (
            id,
            first_name,
            last_name,
            email,
            phone,
            address,
            city
          ),
          staff:staff_id (
            id,
            first_name,
            last_name,
            email
          ),
          branch:branch_id (
            id,
            name,
            address,
            city,
            phone
          ),
          payments (
            id,
            payment_method,
            amount,
            payment_date,
            status,
            reference_number,
            notes
          ),
          order_items (
            id,
            product_id,
            quantity,
            unit_price,
            total_price,
            product:product_id (
              id,
              sku,
              name,
              description,
              unit_of_measure
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return transaction;
    } catch (error) {
      throw new Error(`Failed to fetch sales transaction: ${error}`);
    }
  }

  // Update sales transaction
  static async updateSalesTransaction(id: string, transactionData: any, updatedBy: string) {
    try {
      const { data: transaction, error } = await supabaseAdmin
        .from('sales_transactions')
        .update({
          ...transactionData,
          updated_by_user_id: updatedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log the update
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: updatedBy,
          action: 'sales_transaction_updated',
          entity_type: 'sales_transaction',
          entity_id: id,
          new_values: transactionData,
          created_at: new Date().toISOString()
        });

      return transaction;
    } catch (error) {
      throw new Error(`Failed to update sales transaction: ${error}`);
    }
  }

  // Delete sales transaction (soft delete)
  static async deleteSalesTransaction(id: string, reason: string, deletedBy: string) {
    try {
      const { error } = await supabaseAdmin
        .from('sales_transactions')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by_user_id: deletedBy,
          deletion_reason: reason
        })
        .eq('id', id);

      if (error) throw error;

      // Log the deletion
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: deletedBy,
          action: 'sales_transaction_deleted',
          entity_type: 'sales_transaction',
          entity_id: id,
          new_values: { reason },
          created_at: new Date().toISOString()
        });

      return true;
    } catch (error) {
      throw new Error(`Failed to delete sales transaction: ${error}`);
    }
  }

  // Bulk update transaction status
  static async bulkUpdateTransactionStatus(transactionIds: string[], status: string, notes: string, updatedBy: string) {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('bulk_update_sales_transactions', {
          p_transaction_ids: transactionIds,
          p_status: status,
          p_updated_by_user_id: updatedBy,
          p_notes: notes
        });

      if (error) throw error;

      return {
        count: data,
        transaction_ids: transactionIds,
        status,
        notes
      };
    } catch (error) {
      throw new Error(`Failed to bulk update transactions: ${error}`);
    }
  }

  // Bulk delete transactions
  static async bulkDeleteTransactions(transactionIds: string[], reason: string, deletedBy: string) {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('bulk_delete_sales_transactions', {
          p_transaction_ids: transactionIds,
          p_deleted_by_user_id: deletedBy,
          p_reason: reason
        });

      if (error) throw error;

      return {
        count: data,
        transaction_ids: transactionIds,
        reason
      };
    } catch (error) {
      throw new Error(`Failed to bulk delete transactions: ${error}`);
    }
  }

  // Export sales transactions
  static async exportSalesTransactions(filters: any, format: string) {
    try {
      // Get all transactions matching filters (no pagination for export)
      const { data: transactions, error } = await supabaseAdmin
        .from('sales_transactions_enhanced')
        .select('*');

      if (error) throw error;

      // Apply filters
      let filteredTransactions = transactions || [];
      
      if (filters.date_from) {
        filteredTransactions = filteredTransactions.filter(t => t.transaction_date >= filters.date_from);
      }
      if (filters.date_to) {
        filteredTransactions = filteredTransactions.filter(t => t.transaction_date <= filters.date_to);
      }
      if (filters.status) {
        filteredTransactions = filteredTransactions.filter(t => t.status === filters.status);
      }
      if (filters.payment_status) {
        filteredTransactions = filteredTransactions.filter(t => t.payment_status === filters.payment_status);
      }

      // Generate export file
      if (format === 'excel') {
        return await ExportService.generateExcel(filteredTransactions, 'sales_transactions');
      } else {
        return await ExportService.generateCSV(filteredTransactions, 'sales_transactions');
      }
    } catch (error) {
      throw new Error(`Failed to export sales transactions: ${error}`);
    }
  }

  // Generate transaction PDF
  static async generateTransactionPDF(transactionId: string) {
    try {
      const transaction = await this.getSalesTransactionById(transactionId);
      return await PDFService.generateTransactionPDF(transaction);
    } catch (error) {
      throw new Error(`Failed to generate transaction PDF: ${error}`);
    }
  }

  // Get real-time sales transactions stream
  static async getSalesTransactionsStream(lastUpdated?: string) {
    try {
      let query = supabaseAdmin
        .from('sales_transactions_enhanced')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(50);

      if (lastUpdated) {
        query = query.gt('updated_at', lastUpdated);
      }

      const { data: transactions, error } = await query;

      if (error) throw error;

      return {
        transactions: transactions || [],
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to fetch sales transactions stream: ${error}`);
    }
  }

  // Update transaction status
  static async updateTransactionStatus(id: string, status: string, notes: string, updatedBy: string) {
    try {
      const { data: transaction, error } = await supabaseAdmin
        .from('sales_transactions')
        .update({
          status,
          updated_by_user_id: updatedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log status change
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: updatedBy,
          action: 'sales_transaction_status_updated',
          entity_type: 'sales_transaction',
          entity_id: id,
          new_values: { status, notes },
          created_at: new Date().toISOString()
        });

      return transaction;
    } catch (error) {
      throw new Error(`Failed to update transaction status: ${error}`);
    }
  }

  // ... (existing service methods)
}
```

---

## Export & Reporting

### Export Service: `backend/src/services/export.service.ts`

```typescript
import * as XLSX from 'xlsx';
import { createObjectCsvWriter } from 'csv-writer';

export class ExportService {
  // Generate CSV export
  static async generateCSV(data: any[], filename: string) {
    try {
      const csvWriter = createObjectCsvWriter({
        path: `/tmp/${filename}_${Date.now()}.csv`,
        header: [
          { id: 'transaction_number', title: 'Transaction Number' },
          { id: 'customer_name', title: 'Customer Name' },
          { id: 'customer_email', title: 'Customer Email' },
          { id: 'staff_name', title: 'Staff Name' },
          { id: 'branch_name', title: 'Branch' },
          { id: 'transaction_date', title: 'Transaction Date' },
          { id: 'total_amount', title: 'Total Amount' },
          { id: 'payment_method', title: 'Payment Method' },
          { id: 'payment_status', title: 'Payment Status' },
          { id: 'status', title: 'Status' },
          { id: 'items_count', title: 'Items Count' },
          { id: 'total_quantity', title: 'Total Quantity' }
        ]
      });

      await csvWriter.writeRecords(data);
      
      // Read the file and return as buffer
      const fs = require('fs');
      const filePath = `/tmp/${filename}_${Date.now()}.csv`;
      const fileContent = fs.readFileSync(filePath);
      
      // Clean up
      fs.unlinkSync(filePath);
      
      return fileContent;
    } catch (error) {
      throw new Error(`Failed to generate CSV: ${error}`);
    }
  }

  // Generate Excel export
  static async generateExcel(data: any[], filename: string) {
    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Transactions');
      
      return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    } catch (error) {
      throw new Error(`Failed to generate Excel: ${error}`);
    }
  }
}
```

### PDF Service: `backend/src/services/pdf.service.ts`

```typescript
import PDFDocument from 'pdfkit';

export class PDFService {
  // Generate transaction PDF
  static async generateTransactionPDF(transaction: any) {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];
      
      doc.on('data', buffers.push.bind(buffers));
      
      // Header
      doc.fontSize(20).text('Sales Transaction Receipt', 50, 50);
      doc.fontSize(12).text(`Transaction #: ${transaction.transaction_number}`, 50, 80);
      doc.text(`Date: ${new Date(transaction.transaction_date).toLocaleDateString()}`, 50, 100);
      
      // Customer Information
      doc.fontSize(14).text('Customer Information', 50, 130);
      doc.fontSize(10).text(`Name: ${transaction.customer?.first_name} ${transaction.customer?.last_name}`, 50, 150);
      doc.text(`Email: ${transaction.customer?.email}`, 50, 165);
      doc.text(`Phone: ${transaction.customer?.phone}`, 50, 180);
      
      // Transaction Details
      doc.fontSize(14).text('Transaction Details', 50, 210);
      doc.fontSize(10).text(`Total Amount: $${transaction.total_amount}`, 50, 230);
      doc.text(`Payment Method: ${transaction.payment_method}`, 50, 245);
      doc.text(`Status: ${transaction.status}`, 50, 260);
      
      // Items
      if (transaction.order_items && transaction.order_items.length > 0) {
        doc.fontSize(14).text('Items', 50, 290);
        let yPosition = 310;
        
        transaction.order_items.forEach((item: any) => {
          doc.text(`${item.product?.name} - Qty: ${item.quantity} - $${item.unit_price}`, 50, yPosition);
          yPosition += 15;
        });
      }
      
      doc.end();
      
      return new Promise<Buffer>((resolve, reject) => {
        doc.on('end', () => {
          resolve(Buffer.concat(buffers));
        });
        doc.on('error', reject);
      });
    } catch (error) {
      throw new Error(`Failed to generate PDF: ${error}`);
    }
  }
}
```

---

## Real-time Updates

### WebSocket Implementation: `backend/src/services/websocket.service.ts`

```typescript
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

export class WebSocketService {
  private io: SocketIOServer;

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Join sales room for real-time updates
      socket.join('sales');

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  // Broadcast new transaction
  broadcastNewTransaction(transaction: any) {
    this.io.to('sales').emit('new_transaction', transaction);
  }

  // Broadcast updated transaction
  broadcastUpdatedTransaction(transaction: any) {
    this.io.to('sales').emit('updated_transaction', transaction);
  }

  // Broadcast deleted transaction
  broadcastDeletedTransaction(transactionId: string) {
    this.io.to('sales').emit('deleted_transaction', { id: transactionId });
  }
}
```

---

## Frontend Integration

### API Service: `frontend/src/services/salesService.ts`

```typescript
import { apiClient } from './apiClient';

export interface SalesTransactionFilters {
  search?: string;
  status?: string;
  payment_status?: string;
  payment_method?: string;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  customer_id?: string;
  staff_id?: string;
  branch_id?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export class SalesService {
  // Get sales transactions
  static async getSalesTransactions(filters: SalesTransactionFilters = {}) {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof SalesTransactionFilters] !== undefined) {
        params.append(key, filters[key as keyof SalesTransactionFilters] as string);
      }
    });

    const response = await apiClient.get(`/v1/sales/transactions?${params.toString()}`);
    return response.data;
  }

  // Get specific transaction
  static async getSalesTransactionById(id: string) {
    const response = await apiClient.get(`/v1/sales/transactions/${id}`);
    return response.data;
  }

  // Update transaction
  static async updateSalesTransaction(id: string, data: any) {
    const response = await apiClient.put(`/v1/sales/transactions/${id}`, data);
    return response.data;
  }

  // Delete transaction
  static async deleteSalesTransaction(id: string, reason: string) {
    const response = await apiClient.delete(`/v1/sales/transactions/${id}`, {
      data: { reason }
    });
    return response.data;
  }

  // Bulk update status
  static async bulkUpdateTransactionStatus(transactionIds: string[], status: string, notes?: string) {
    const response = await apiClient.put('/v1/sales/transactions/bulk/status', {
      transaction_ids: transactionIds,
      status,
      notes
    });
    return response.data;
  }

  // Bulk delete transactions
  static async bulkDeleteTransactions(transactionIds: string[], reason: string) {
    const response = await apiClient.delete('/v1/sales/transactions/bulk', {
      data: {
        transaction_ids: transactionIds,
        reason
      }
    });
    return response.data;
  }

  // Export transactions
  static async exportSalesTransactions(filters: any, format: 'csv' | 'excel' = 'csv') {
    const params = new URLSearchParams();
    params.append('format', format);
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined) {
        params.append(key, filters[key]);
      }
    });

    const response = await apiClient.get(`/v1/sales/transactions/export?${params.toString()}`, {
      responseType: 'blob'
    });
    
    return response.data;
  }

  // Print transaction
  static async printSalesTransaction(id: string) {
    const response = await apiClient.get(`/v1/sales/transactions/print/${id}`, {
      responseType: 'blob'
    });
    
    return response.data;
  }

  // Get real-time stream
  static async getSalesTransactionsStream(lastUpdated?: string) {
    const params = new URLSearchParams();
    if (lastUpdated) {
      params.append('last_updated', lastUpdated);
    }

    const response = await apiClient.get(`/v1/sales/transactions/stream?${params.toString()}`);
    return response.data;
  }

  // Update transaction status
  static async updateTransactionStatus(id: string, status: string, notes?: string) {
    const response = await apiClient.put(`/v1/sales/transactions/${id}/status`, {
      status,
      notes
    });
    return response.data;
  }
}
```

### React Hook: `frontend/src/hooks/useSalesTransactions.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { SalesService, SalesTransactionFilters } from '../services/salesService';

export const useSalesTransactions = (filters: SalesTransactionFilters = {}) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0
  });

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await SalesService.getSalesTransactions(filters);
      setTransactions(response.data.transactions);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const updateTransaction = async (id: string, data: any) => {
    try {
      setLoading(true);
      const response = await SalesService.updateSalesTransaction(id, data);
      await fetchTransactions(); // Refresh the list
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update transaction');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTransaction = async (id: string, reason: string) => {
    try {
      setLoading(true);
      await SalesService.deleteSalesTransaction(id, reason);
      await fetchTransactions(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete transaction');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const bulkUpdateStatus = async (transactionIds: string[], status: string, notes?: string) => {
    try {
      setLoading(true);
      const response = await SalesService.bulkUpdateTransactionStatus(transactionIds, status, notes);
      await fetchTransactions(); // Refresh the list
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bulk update transactions');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const bulkDelete = async (transactionIds: string[], reason: string) => {
    try {
      setLoading(true);
      const response = await SalesService.bulkDeleteTransactions(transactionIds, reason);
      await fetchTransactions(); // Refresh the list
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bulk delete transactions');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const exportTransactions = async (format: 'csv' | 'excel' = 'csv') => {
    try {
      const blob = await SalesService.exportSalesTransactions(filters, format);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sales_transactions_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export transactions');
      throw err;
    }
  };

  const printTransaction = async (id: string) => {
    try {
      const blob = await SalesService.printSalesTransaction(id);
      
      // Open in new window for printing
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to print transaction');
      throw err;
    }
  };

  return {
    transactions,
    loading,
    error,
    pagination,
    fetchTransactions,
    updateTransaction,
    deleteTransaction,
    bulkUpdateStatus,
    bulkDelete,
    exportTransactions,
    printTransaction
  };
};
```

---

## Implementation Steps

### Step 1: Database Setup
1. Run the SQL migrations to create enhanced views and functions
2. Create the audit logging triggers
3. Test the database functions

### Step 2: Backend Implementation
1. Create the enhanced `SalesService` class
2. Create the enhanced `SalesController` class
3. Create the `ExportService` and `PDFService` classes
4. Update the `sales.routes.ts` file
5. Add WebSocket support for real-time updates
6. Test all endpoints

### Step 3: Frontend Integration
1. Create the enhanced `salesService.ts` API service
2. Create the `useSalesTransactions.ts` React hook
3. Update your `AllSalesRecords.tsx` component to use the new service
4. Add real-time updates with WebSocket
5. Add export and print functionality

### Step 4: Testing
1. Test all CRUD operations
2. Test filtering and pagination
3. Test bulk operations
4. Test export functionality
5. Test real-time updates

### Step 5: Performance & Security
1. Add database indexes for performance
2. Add rate limiting for exports
3. Add proper error handling
4. Test with large datasets
5. Add audit logging verification

---

## Additional Considerations

### Performance Optimization
- Use database views for complex joins
- Add proper indexes for filtering
- Implement pagination for large datasets
- Cache frequently accessed data

### Security Enhancements
- Validate all input data
- Add proper authorization checks
- Implement audit logging
- Add rate limiting for exports

### Real-time Updates
- Use WebSocket for live updates
- Implement fallback polling
- Handle connection failures gracefully
- Add user presence indicators

This implementation provides a complete sales records management system with advanced filtering, bulk operations, export capabilities, and real-time updates.
