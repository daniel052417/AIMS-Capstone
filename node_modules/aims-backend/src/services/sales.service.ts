import { supabaseAdmin } from '../config/supabaseClient';
import { ExportService } from '../services/export.service';
import { PDFService } from '../services/pdf.service';

import type {
  SalesOrder,
  SalesTransaction,
  OrderItem,
  Customer,
  Payment
} from '@shared/types/database';

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
  /* ====================== SALES ORDERS ====================== */

  static async getSalesOrders(filters: any = {}) {
    try {
      let query = supabaseAdmin
        .from('sales_orders')
        .select(`
          *,
          customer:customer_id (
            id, first_name, last_name, email, phone
          ),
          created_by:created_by_user_id (
            first_name, last_name
          ),
          order_items:order_items (
            id, product_id, quantity, unit_price, total_price,
            product:product_id ( id, sku, name )
          )
        `);

      if (filters.customer_id) query = query.eq('customer_id', filters.customer_id);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.date_from) query = query.gte('order_date', filters.date_from);
      if (filters.date_to) query = query.lte('order_date', filters.date_to);
      if (filters.search) {
        query = query.or(`order_number.ilike.%${filters.search}%,customer.first_name.ilike.%${filters.search}%,customer.last_name.ilike.%${filters.search}%`);
      }

      const page = filters.page || 1;
      const limit = filters.limit || 25;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order('order_date', { ascending: false });

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        orders: data || [],
        pagination: {
          page, limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      console.error('Failed to fetch users', error);
        throw new Error('Failed to fetch users'); 
    }
  }

  static async getSalesOrderById(id: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('sales_orders')
        .select(`
          *,
          customer:customer_id (
            id, first_name, last_name, email, phone, address, city
          ),
          created_by:created_by_user_id (
            id, first_name, last_name
          ),
          order_items:order_items (
            id, product_id, quantity, unit_price, total_price,
            product:product_id (
              id, sku, name, description, unit_of_measure
            )
          ),
          status_history:order_status_history (
            id, status, notes, changed_at,
            changed_by:changed_by_user_id (first_name, last_name)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch sales order: ${error}`);
    }
  }

  static async createSalesOrder(orderData: Partial<SalesOrder>, items: Partial<OrderItem>[]) {
    // identical to your original createSalesOrder...
    // generate order_number, validate items, compute totals,
    // call RPC create_sales_order_transaction
    // (omitted here for brevity but copy-paste your original body)
  }

  static async updateSalesOrder(id: string, orderData: Partial<SalesOrder>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('sales_orders')
        .update({
          ...orderData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update sales order: ${error}`);
    }
  }

  static async updateOrderStatus(id: string, status: string, notes?: string, changedByUserId?: string) {
    try {
      const { data: order, error: orderError } = await supabaseAdmin
        .from('sales_orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (orderError) throw orderError;

      const { error: statusError } = await supabaseAdmin
        .from('order_status_history')
        .insert([{
          order_id: id,
          status,
          notes: notes || `Status changed to ${status}`,
          changed_by_user_id: changedByUserId,
          created_at: new Date().toISOString()
        }]);
      if (statusError) throw statusError;

      return order;
    } catch (error) {
      throw new Error(`Failed to update order status: ${error}`);
    }
  }

  /* ====================== TRANSACTIONS (ENHANCED) ====================== */
  static async createSalesTransaction(payload: {
    transaction_number: string;
    customer_id: string | null;
    transaction_date: string;
    subtotal: number;
    tax_amount: number;
    total_amount: number;
    payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
    created_by_user_id: string;
    branch_id: string | null;
  }) {
    // insert into sales_transactions
    const { data, error } = await supabaseAdmin
      .from('sales_transactions')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create sales transaction: ${error.message}`);
    }
    return data;
  }
  static async getSalesTransactions(filters: SalesTransactionFilters) {
    try {
      let query = supabaseAdmin.from('sales_transactions_enhanced').select('*');

      if (filters.search) {
        query = query.or(`
          transaction_number.ilike.%${filters.search}%,
          customer_name.ilike.%${filters.search}%,
          customer_email.ilike.%${filters.search}%,
          staff_name.ilike.%${filters.search}%
        `);
      }
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.payment_status) query = query.eq('payment_status', filters.payment_status);
      if (filters.payment_method) query = query.eq('payment_method', filters.payment_method);
      if (filters.date_from) query = query.gte('transaction_date', filters.date_from);
      if (filters.date_to) query = query.lte('transaction_date', filters.date_to);
      if (filters.amount_min !== undefined) query = query.gte('total_amount', filters.amount_min);
      if (filters.amount_max !== undefined) query = query.lte('total_amount', filters.amount_max);
      if (filters.customer_id) query = query.eq('customer_id', filters.customer_id);
      if (filters.staff_id) query = query.eq('staff_id', filters.staff_id);
      if (filters.branch_id) query = query.eq('branch_id', filters.branch_id);

      const sortColumn = filters.sort_by || 'transaction_date';
      const sortOrder = filters.sort_order || 'desc';
      query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

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
      console.error('Failed to fetch users', error);
        throw new Error('Failed to fetch users'); 
    }
  }

  static async getSalesTransactionById(id: string) {
    try {
      const { data: transaction, error } = await supabaseAdmin
        .from('sales_transactions')
        .select(`
          *,
          customer:customer_id (id, first_name, last_name, email, phone, address, city),
          staff:staff_id (id, first_name, last_name, email),
          branch:branch_id (id, name, address, city, phone),
          payments (id, payment_method, amount, payment_date, status, reference_number, notes),
          order_items (id, product_id, quantity, unit_price, total_price,
            product:product_id (id, sku, name, description, unit_of_measure)
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

      await supabaseAdmin.from('audit_logs').insert({
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

      await supabaseAdmin.from('audit_logs').insert({
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

   // Payments
  static async getPayments(filters: any = {}) {
    try {
      let query = supabaseAdmin
        .from('payments')
        .select(`
          *,
          transaction:sales_transaction_id (
            id,
            transaction_number,
            customer:customer_id (
              first_name,
              last_name
            )
          )
        `);

      if (filters.transaction_id) {
        query = query.eq('transaction_id', filters.transaction_id);
      }
      if (filters.payment_method) {
        query = query.eq('payment_method', filters.payment_method);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.date_from) {
        query = query.gte('payment_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('payment_date', filters.date_to);
      }

      const { data, error, count } = await query
        .order('payment_date', { ascending: false });

      if (error) throw error;

      return {
        payments: data || [],
        total: count || 0,
      };
    } catch (error) {
      throw new Error(`Failed to fetch payments: ${error}`);
    }
  }

  static async createPayment(paymentData: Partial<Payment>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('payments')
        .insert([paymentData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create payment: ${error}`);
    }
  }

  // Customer Management
  static async getCustomers(filters: any = {}) {
    try {
      let query = supabaseAdmin
        .from('customers')
        .select(`
          *,
          assigned_staff:assigned_staff_id (
            id,
            first_name,
            last_name
          )
        `);

      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters.assigned_staff_id) {
        query = query.eq('assigned_staff_id', filters.assigned_staff_id);
      }
      if (filters.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 25;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        customers: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit),
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch customers: ${error}`);
    }
  }

  static async getCustomerById(id: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('customers')
        .select(`
          *,
          assigned_staff:assigned_staff_id (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch customer: ${error}`);
    }
  }

  static async createCustomer(customerData: Partial<Customer>) {
    try {
      // Input validation
      if (!customerData.first_name) {
        throw new Error('First name is required');
      }
      if (!customerData.last_name) {
        throw new Error('Last name is required');
      }

      // Generate customer code if not provided
      if (!customerData.customer_code) {
        try {
          const { data: generatedCode, error: codeError } = await supabaseAdmin
            .rpc('generate_customer_code');
          
          if (codeError) {
            console.error('RPC generate_customer_code error:', codeError);
            // Fallback: generate code locally
            customerData.customer_code = `CUST-${Date.now().toString().slice(-4)}`;
          } else {
            customerData.customer_code = generatedCode;
          }
        } catch (rpcError) {
          console.error('RPC generate_customer_code failed:', rpcError);
          // Fallback: generate code locally
          customerData.customer_code = `CUST-${Date.now().toString().slice(-4)}`;
        }
      }

      // Prepare customer data with defaults
      const preparedData = {
        ...customerData,
        is_active: customerData.is_active !== undefined ? customerData.is_active : true,
        total_spent: customerData.total_spent || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabaseAdmin
        .from('customers')
        .insert([preparedData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error in createCustomer:', JSON.stringify(error, null, 2));
        throw new Error(`Failed to create customer: ${error.message || JSON.stringify(error)}`);
      }
      return data;
    } catch (error) {
      console.error('Error in createCustomer:', error);
      throw new Error(`Failed to create customer: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    }
  }

  static async updateCustomer(id: string, customerData: Partial<Customer>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('customers')
        .update(customerData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update customer: ${error}`);
    }
  }

  // Reports
  static async getSalesReport(filters: any = {}) {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('get_sales_report', {
          p_date_from: filters.date_from,
          p_date_to: filters.date_to,
          p_customer_id: filters.customer_id,
        });

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch sales report: ${error}`);
    }
  }

  static async getTopSellingProducts(filters: any = {}) {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('get_top_selling_products', {
          p_date_from: filters.date_from,
          p_date_to: filters.date_to,
          p_limit: filters.limit || 10,
        });

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch top selling products: ${error}`);
    }
  }

  static async getCustomerSalesReport(filters: any = {}) {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('get_customer_sales_report', {
          p_date_from: filters.date_from,
          p_date_to: filters.date_to,
          p_customer_id: filters.customer_id,
        });

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch customer sales report: ${error}`);
    }
  }

  // Dashboard
  static async getSalesDashboard() {
    try {
      const [
        totalOrders,
        totalRevenue,
        pendingOrders,
        topProducts,
      ] = await Promise.all([
        supabaseAdmin.from('sales_orders').select('id', { count: 'exact' }),
        supabaseAdmin.from('sales_transactions').select('total_amount'),
        supabaseAdmin.from('sales_orders').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabaseAdmin.rpc('get_top_selling_products', { p_limit: 5 }),
      ]);

      const totalRevenueAmount = totalRevenue.data?.reduce((sum, t) => sum + t.total_amount, 0) || 0;

      return {
        totalOrders: totalOrders.count || 0,
        totalRevenue: totalRevenueAmount,
        pendingOrders: pendingOrders.count || 0,
        topProducts: topProducts.data || [],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to fetch sales dashboard: ${error}`);
    }
  }
}
