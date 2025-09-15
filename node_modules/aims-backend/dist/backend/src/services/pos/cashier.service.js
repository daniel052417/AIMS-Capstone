"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POSCashierService = void 0;
const supabaseClient_1 = require("../../config/supabaseClient");
class POSCashierService {
    static async getDashboard() {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .rpc('get_pos_dashboard_data');
            if (error)
                throw error;
            return {
                totalSalesToday: data[0]?.total_sales_today || 0,
                totalTransactionsToday: data[0]?.total_transactions_today || 0,
                totalCustomersToday: data[0]?.total_customers_today || 0,
                averageTransactionValue: data[0]?.average_transaction_value || 0,
                lowStockProducts: data[0]?.low_stock_products || 0,
                recentTransactions: data[0]?.recent_transactions || [],
                topProducts: data[0]?.top_products || []
            };
        }
        catch (error) {
            console.error('Error fetching POS dashboard:', error);
            throw new Error(`Failed to fetch dashboard data: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
    }
    static async getProducts(filters = {}) {
        try {
            let query = supabaseClient_1.supabaseAdmin
                .from('products')
                .select(`
          *,
          category:category_id (
            id,
            name,
            description
          ),
          supplier:supplier_id (
            id,
            name,
            contact_person
          )
        `)
                .eq('is_active', true);
            if (filters.category_id) {
                query = query.eq('category_id', filters.category_id);
            }
            if (filters.search) {
                query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,barcode.ilike.%${filters.search}%`);
            }
            if (filters.low_stock) {
                query = query.lte('stock_quantity', supabaseClient_1.supabaseAdmin.raw('minimum_stock'));
            }
            const page = filters.page || 1;
            const limit = filters.limit || 25;
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            query = query.range(from, to).order('name');
            const { data, error, count } = await query;
            if (error)
                throw error;
            return {
                products: data || [],
                pagination: {
                    page,
                    limit,
                    total: count || 0,
                    pages: Math.ceil((count || 0) / limit)
                }
            };
        }
        catch (error) {
            console.error('Error fetching products:', error);
            throw new Error(`Failed to fetch products: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
    }
    static async searchProducts(searchTerm) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('products')
                .select(`
          id,
          sku,
          name,
          unit_price,
          stock_quantity,
          barcode,
          category:category_id (
            name
          )
        `)
                .eq('is_active', true)
                .or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`)
                .order('name')
                .limit(20);
            if (error)
                throw error;
            return data || [];
        }
        catch (error) {
            console.error('Error searching products:', error);
            throw new Error(`Failed to search products: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
    }
    static async getProductById(id) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('products')
                .select(`
          *,
          category:category_id (
            id,
            name,
            description
          ),
          supplier:supplier_id (
            id,
            name,
            contact_person,
            email,
            phone
          )
        `)
                .eq('id', id)
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            console.error('Error fetching product:', error);
            throw new Error(`Failed to fetch product: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
    }
    static async checkInventory(productId) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('products')
                .select('id, sku, name, stock_quantity, minimum_stock, maximum_stock')
                .eq('id', productId)
                .single();
            if (error)
                throw error;
            return {
                ...data,
                isLowStock: data.stock_quantity <= data.minimum_stock,
                isOutOfStock: data.stock_quantity <= 0
            };
        }
        catch (error) {
            console.error('Error checking inventory:', error);
            throw new Error(`Failed to check inventory: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
    }
    static async getLowStockItems() {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('products')
                .select(`
          id,
          sku,
          name,
          stock_quantity,
          minimum_stock,
          unit_of_measure,
          category:category_id (
            name
          )
        `)
                .eq('is_active', true)
                .lte('stock_quantity', supabaseClient_1.supabaseAdmin.raw('minimum_stock'))
                .order('stock_quantity');
            if (error)
                throw error;
            return data || [];
        }
        catch (error) {
            console.error('Error fetching low stock items:', error);
            throw new Error(`Failed to fetch low stock items: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
    }
    static async getQuickSales() {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .rpc('get_quick_sales_products');
            if (error)
                throw error;
            return data || [];
        }
        catch (error) {
            console.error('Error fetching quick sales:', error);
            throw new Error(`Failed to fetch quick sales: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
    }
    static async getCustomers(filters = {}) {
        try {
            let query = supabaseClient_1.supabaseAdmin
                .from('customers')
                .select('*')
                .eq('is_active', true);
            if (filters.search) {
                query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
            }
            const page = filters.page || 1;
            const limit = filters.limit || 25;
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            query = query.range(from, to).order('last_name');
            const { data, error, count } = await query;
            if (error)
                throw error;
            return {
                customers: data || [],
                pagination: {
                    page,
                    limit,
                    total: count || 0,
                    pages: Math.ceil((count || 0) / limit)
                }
            };
        }
        catch (error) {
            console.error('Error fetching customers:', error);
            throw new Error(`Failed to fetch customers: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
    }
    static async searchCustomers(searchTerm) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('customers')
                .select('id, customer_code, first_name, last_name, email, phone, total_orders, total_spent')
                .eq('is_active', true)
                .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
                .order('last_name')
                .limit(20);
            if (error)
                throw error;
            return data || [];
        }
        catch (error) {
            console.error('Error searching customers:', error);
            throw new Error(`Failed to search customers: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
    }
    static async getCustomerById(id) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('customers')
                .select('*')
                .eq('id', id)
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            console.error('Error fetching customer:', error);
            throw new Error(`Failed to fetch customer: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
    }
    static async createCustomer(customerData) {
        try {
            if (!customerData.customer_code) {
                const { data: lastCustomer } = await supabaseClient_1.supabaseAdmin
                    .from('customers')
                    .select('customer_code')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();
                const lastCode = lastCustomer?.customer_code || 'CUST0000';
                const nextNumber = parseInt(lastCode.replace('CUST', '')) + 1;
                customerData.customer_code = `CUST${nextNumber.toString().padStart(4, '0')}`;
            }
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('customers')
                .insert([{
                    ...customerData,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            console.error('Error creating customer:', error);
            throw new Error(`Failed to create customer: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
    }
    static async updateCustomer(id, customerData) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('customers')
                .update({
                ...customerData,
                updated_at: new Date().toISOString()
            })
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            console.error('Error updating customer:', error);
            throw new Error(`Failed to update customer: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
    }
    static async getTransactions(filters = {}) {
        try {
            let query = supabaseClient_1.supabaseAdmin
                .from('sales_transactions')
                .select(`
          *,
          customer:customer_id (
            id,
            first_name,
            last_name,
            email
          ),
          created_by:created_by_user_id (
            first_name,
            last_name
          )
        `);
            if (filters.customer_id) {
                query = query.eq('customer_id', filters.customer_id);
            }
            if (filters.payment_status) {
                query = query.eq('payment_status', filters.payment_status);
            }
            if (filters.date_from) {
                query = query.gte('transaction_date', filters.date_from);
            }
            if (filters.date_to) {
                query = query.lte('transaction_date', filters.date_to);
            }
            const page = filters.page || 1;
            const limit = filters.limit || 25;
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            query = query.range(from, to).order('transaction_date', { ascending: false });
            const { data, error, count } = await query;
            if (error)
                throw error;
            return {
                transactions: data || [],
                pagination: {
                    page,
                    limit,
                    total: count || 0,
                    pages: Math.ceil((count || 0) / limit)
                }
            };
        }
        catch (error) {
            console.error('Error fetching transactions:', error);
            throw new Error(`Failed to fetch transactions: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
    }
    static async getTransactionById(id) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('sales_transactions')
                .select(`
          *,
          customer:customer_id (
            id,
            first_name,
            last_name,
            email,
            phone
          ),
          created_by:created_by_user_id (
            first_name,
            last_name
          ),
          transaction_items:transaction_items (
            id,
            product_id,
            quantity,
            unit_price,
            total_price,
            product:product_id (
              id,
              sku,
              name
            )
          )
        `)
                .eq('id', id)
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            console.error('Error fetching transaction:', error);
            throw new Error(`Failed to fetch transaction: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
    }
    static async createTransaction(transactionData) {
        try {
            if (!transactionData.transaction_number) {
                const { data: lastTransaction } = await supabaseClient_1.supabaseAdmin
                    .from('sales_transactions')
                    .select('transaction_number')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();
                const lastNumber = lastTransaction?.transaction_number || 'TXN0000';
                const nextNumber = parseInt(lastNumber.replace('TXN', '')) + 1;
                transactionData.transaction_number = `TXN${nextNumber.toString().padStart(4, '0')}`;
            }
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('sales_transactions')
                .insert([{
                    ...transactionData,
                    transaction_date: transactionData.transaction_date || new Date().toISOString(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            console.error('Error creating transaction:', error);
            throw new Error(`Failed to create transaction: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
    }
    static async updateTransaction(id, transactionData) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('sales_transactions')
                .update({
                ...transactionData,
                updated_at: new Date().toISOString()
            })
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            console.error('Error updating transaction:', error);
            throw new Error(`Failed to update transaction: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
    }
    static async cancelTransaction(id) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('sales_transactions')
                .update({
                payment_status: 'refunded',
                updated_at: new Date().toISOString()
            })
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            console.error('Error canceling transaction:', error);
            throw new Error(`Failed to cancel transaction: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
    }
    static async createSalesTransaction(transactionData) {
        return this.createTransaction(transactionData);
    }
    static async getSalesTransactionById(id) {
        return this.getTransactionById(id);
    }
    static async getTransactionItems(transactionId) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('transaction_items')
                .select(`
          *,
          product:product_id (
            id,
            sku,
            name,
            unit_of_measure
          )
        `)
                .eq('transaction_id', transactionId)
                .order('created_at');
            if (error)
                throw error;
            return data || [];
        }
        catch (error) {
            console.error('Error fetching transaction items:', error);
            throw new Error(`Failed to fetch transaction items: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
    }
    static async createTransactionItem(itemData) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('transaction_items')
                .insert([{
                    ...itemData,
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            console.error('Error creating transaction item:', error);
            throw new Error(`Failed to create transaction item: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
    }
    static async processPayment(paymentData) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('payments')
                .insert([{
                    ...paymentData,
                    payment_date: paymentData.payment_date || new Date().toISOString(),
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            console.error('Error processing payment:', error);
            throw new Error(`Failed to process payment: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
    }
    static async getPayments(transactionId) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('payments')
                .select('*')
                .eq('transaction_id', transactionId)
                .order('payment_date');
            if (error)
                throw error;
            return data || [];
        }
        catch (error) {
            console.error('Error fetching payments:', error);
            throw new Error(`Failed to fetch payments: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
    }
    static async startSession(sessionData) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('pos_sessions')
                .insert([{
                    ...sessionData,
                    status: 'open',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            console.error('Error starting session:', error);
            throw new Error(`Failed to start session: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
    }
    static async endSession(id, closingData) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('pos_sessions')
                .update({
                status: 'closed',
                closing_cash_amount: closingData.closing_cash_amount,
                total_sales: closingData.total_sales,
                total_transactions: closingData.total_transactions,
                updated_at: new Date().toISOString()
            })
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            console.error('Error ending session:', error);
            throw new Error(`Failed to end session: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
    }
    static async getCurrentSession(cashierId) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('pos_sessions')
                .select('*')
                .eq('cashier_id', cashierId)
                .eq('status', 'open')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            if (error && error.code !== 'PGRST116')
                throw error;
            return data;
        }
        catch (error) {
            console.error('Error fetching current session:', error);
            throw new Error(`Failed to fetch current session: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
    }
    static async getSessionById(id) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('pos_sessions')
                .select('*')
                .eq('id', id)
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            console.error('Error fetching session:', error);
            throw new Error(`Failed to fetch session: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
    }
    static async generateReceipt(transactionId) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .rpc('generate_receipt_data', { transaction_id: transactionId });
            if (error)
                throw error;
            return data[0] || null;
        }
        catch (error) {
            console.error('Error generating receipt:', error);
            throw new Error(`Failed to generate receipt: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
    }
    static async getDailyReport(date) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .rpc('get_daily_sales_report', { report_date: date });
            if (error)
                throw error;
            return data[0] || null;
        }
        catch (error) {
            console.error('Error fetching daily report:', error);
            throw new Error(`Failed to fetch daily report: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
    }
    static async getSalesReport(filters = {}) {
        try {
            let query = supabaseClient_1.supabaseAdmin
                .from('sales_transactions')
                .select(`
          id,
          transaction_date,
          total_amount,
          payment_status,
          customer:customer_id (
            first_name,
            last_name
          )
        `);
            if (filters.date_from) {
                query = query.gte('transaction_date', filters.date_from);
            }
            if (filters.date_to) {
                query = query.lte('transaction_date', filters.date_to);
            }
            if (filters.payment_status) {
                query = query.eq('payment_status', filters.payment_status);
            }
            query = query.order('transaction_date', { ascending: false });
            const { data, error } = await query;
            if (error)
                throw error;
            const totalSales = data?.reduce((sum, t) => sum + t.total_amount, 0) || 0;
            const totalTransactions = data?.length || 0;
            const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;
            return {
                summary: {
                    totalSales,
                    totalTransactions,
                    averageTransaction
                },
                transactions: data || []
            };
        }
        catch (error) {
            console.error('Error fetching sales report:', error);
            throw new Error(`Failed to fetch sales report: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
    }
}
exports.POSCashierService = POSCashierService;
//# sourceMappingURL=cashier.service.js.map