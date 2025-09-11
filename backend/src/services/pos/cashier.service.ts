import { supabaseAdmin } from '../../config/supabaseClient';
import type { 
  POSTransaction, 
  POSSession, 
  Product, 
  Customer, 
  SalesTransaction,
  TransactionItem,
  Payment,
  OrderItem,
  SalesOrder
} from '@shared/types/database';

export class POSCashierService {
  // Dashboard
  static async getDashboard() {
    try {
      const [
        transactionsResult,
        productsResult,
        customersResult,
        sessionsResult
      ] = await Promise.all([
        supabaseAdmin.from('pos_transactions').select('id', { count: 'exact' }),
        supabaseAdmin.from('products').select('id', { count: 'exact' }),
        supabaseAdmin.from('customers').select('id', { count: 'exact' }),
        supabaseAdmin.from('pos_sessions').select('id', { count: 'exact' })
      ]);

      return {
        totalTransactions: transactionsResult.count || 0,
        totalProducts: productsResult.count || 0,
        totalCustomers: customersResult.count || 0,
        activeSessions: sessionsResult.count || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to fetch POS dashboard: ${error}`);
    }
  }

  // Product Management
  static async getProducts(filters: any = {}) {
    try {
      let query = supabaseAdmin
        .from('products')
        .select(`
          *,
          categories:category_id (
            name
          ),
          suppliers:supplier_id (
            name
          )
        `);

      // Apply filters
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,barcode.ilike.%${filters.search}%`);
      }
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
      }
      if (filters.supplier_id) {
        query = query.eq('supplier_id', filters.supplier_id);
      }
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters.low_stock) {
        query = query.lte('stock_quantity', 'minimum_stock');
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order('name');

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        products: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch products: ${error}`);
    }
  }

  static async searchProducts(searchTerm: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select(`
          id,
          sku,
          name,
          unit_price,
          stock_quantity,
          barcode,
          unit_of_measure
        `)
        .or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`)
        .eq('is_active', true)
        .limit(20);

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to search products: ${error}`);
    }
  }

  static async getProductById(id: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select(`
          *,
          categories:category_id (
            name
          ),
          suppliers:supplier_id (
            name
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch product: ${error}`);
    }
  }

  // Customer Management
  static async getCustomers(filters: any = {}) {
    try {
      let query = supabaseAdmin
        .from('customers')
        .select('*');

      // Apply filters
      if (filters.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,customer_code.ilike.%${filters.search}%`);
      }
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
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
          pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch customers: ${error}`);
    }
  }

  static async searchCustomers(searchTerm: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('customers')
        .select(`
          id,
          customer_code,
          first_name,
          last_name,
          email,
          phone,
          total_orders,
          total_spent
        `)
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,customer_code.ilike.%${searchTerm}%`)
        .eq('is_active', true)
        .limit(20);

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to search customers: ${error}`);
    }
  }

  static async getCustomerById(id: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('customers')
        .select('*')
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
      const { data, error } = await supabaseAdmin
        .from('customers')
        .insert([customerData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create customer: ${error}`);
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

  // Transaction Management
  static async getTransactions(filters: any = {}) {
    try {
      let query = supabaseAdmin
        .from('pos_transactions')
        .select(`
          *,
          pos_sessions:pos_session_id (
            cashier_id
          ),
          sales_transactions:sales_transaction_id (
            transaction_number,
            customer_id
          )
        `);

      if (filters.pos_session_id) {
        query = query.eq('pos_session_id', filters.pos_session_id);
      }
      if (filters.transaction_type) {
        query = query.eq('transaction_type', filters.transaction_type);
      }
      if (filters.date_from) {
        query = query.gte('transaction_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('transaction_date', filters.date_to);
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order('transaction_date', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        transactions: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch transactions: ${error}`);
    }
  }

  static async getTransactionById(id: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('pos_transactions')
        .select(`
          *,
          pos_sessions:pos_session_id (
            cashier_id,
            branch_id
          ),
          sales_transactions:sales_transaction_id (
            transaction_number,
            customer_id,
            subtotal,
            tax_amount,
            total_amount
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch transaction: ${error}`);
    }
  }

  static async createTransaction(transactionData: Partial<POSTransaction>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('pos_transactions')
        .insert([transactionData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create transaction: ${error}`);
    }
  }

  static async updateTransaction(id: string, transactionData: Partial<POSTransaction>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('pos_transactions')
        .update(transactionData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update transaction: ${error}`);
    }
  }

  static async cancelTransaction(id: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('pos_transactions')
        .update({
          transaction_type: 'void',
          notes: 'Transaction cancelled'
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to cancel transaction: ${error}`);
    }
  }

  // Sales Transaction Management
  static async createSalesTransaction(transactionData: Partial<SalesTransaction>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('sales_transactions')
        .insert([transactionData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create sales transaction: ${error}`);
    }
  }

  static async getSalesTransactionById(id: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('sales_transactions')
        .select(`
          *,
          customers:customer_id (
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
      throw new Error(`Failed to fetch sales transaction: ${error}`);
    }
  }

  // Transaction Items
  static async getTransactionItems(transactionId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('transaction_items')
        .select(`
          *,
          products:product_id (
            name,
            sku,
            unit_price
          )
        `)
        .eq('transaction_id', transactionId);

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch transaction items: ${error}`);
    }
  }

  static async createTransactionItem(itemData: Partial<TransactionItem>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('transaction_items')
        .insert([itemData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create transaction item: ${error}`);
    }
  }

  // Payment Processing
  static async processPayment(paymentData: Partial<Payment>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('payments')
        .insert([paymentData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to process payment: ${error}`);
    }
  }

  static async getPayments(transactionId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('transaction_id', transactionId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch payments: ${error}`);
    }
  }

  // POS Session Management
  static async startSession(sessionData: Partial<POSSession>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('pos_sessions')
        .insert([sessionData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to start session: ${error}`);
    }
  }

  static async endSession(id: string, closingData: Partial<POSSession>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('pos_sessions')
        .update({
          ...closingData,
          end_time: new Date().toISOString(),
          status: 'closed'
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to end session: ${error}`);
    }
  }

  static async getCurrentSession(cashierId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('pos_sessions')
        .select('*')
        .eq('cashier_id', cashierId)
        .eq('status', 'open')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to get current session: ${error}`);
    }
  }

  static async getSessionById(id: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('pos_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch session: ${error}`);
    }
  }

  // Receipt Management
  static async generateReceipt(transactionId: string) {
    try {
      const transaction = await this.getTransactionById(transactionId);
      const items = await this.getTransactionItems(transactionId);
      const payments = await this.getPayments(transactionId);

      return {
        transaction,
        items,
        payments,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to generate receipt: ${error}`);
    }
  }

  // Reports
  static async getDailyReport(date: string) {
    try {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      const { data, error } = await supabaseAdmin
        .from('pos_transactions')
        .select(`
          *,
          pos_sessions:pos_session_id (
            cashier_id
          )
        `)
        .gte('transaction_date', startDate.toISOString())
        .lt('transaction_date', endDate.toISOString())
        .eq('transaction_type', 'sale');

      if (error) throw error;

      const totalSales = data?.reduce((sum, transaction) => sum + Number(transaction.amount), 0) || 0;
      const totalTransactions = data?.length || 0;

      return {
        date,
        totalSales,
        totalTransactions,
        transactions: data || []
      };
    } catch (error) {
      throw new Error(`Failed to fetch daily report: ${error}`);
    }
  }

  static async getSalesReport(filters: any = {}) {
    try {
      let query = supabaseAdmin
        .from('pos_transactions')
        .select(`
          *,
          pos_sessions:pos_session_id (
            cashier_id,
            branch_id
          )
        `)
        .eq('transaction_type', 'sale');

      if (filters.date_from) {
        query = query.gte('transaction_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('transaction_date', filters.date_to);
      }
      if (filters.cashier_id) {
        query = query.eq('pos_sessions.cashier_id', filters.cashier_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const totalSales = data?.reduce((sum, transaction) => sum + Number(transaction.amount), 0) || 0;
      const totalTransactions = data?.length || 0;

      return {
        totalSales,
        totalTransactions,
        transactions: data || [],
        filters
      };
    } catch (error) {
      throw new Error(`Failed to fetch sales report: ${error}`);
    }
  }

  // Inventory Checks
  static async checkInventory(productId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select('stock_quantity, minimum_stock, maximum_stock')
        .eq('id', productId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to check inventory: ${error}`);
    }
  }

  static async getLowStockItems() {
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select('id, sku, name, stock_quantity, minimum_stock')
        .lte('stock_quantity', 'minimum_stock')
        .eq('is_active', true);

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch low stock items: ${error}`);
    }
  }

  // Quick Sales
  static async getQuickSales() {
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select('id, sku, name, unit_price, barcode')
        .eq('is_active', true)
        .order('name')
        .limit(20);

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch quick sales: ${error}`);
    }
  }
}