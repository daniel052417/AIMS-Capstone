"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesService = void 0;
const supabaseClient_1 = require("../config/supabaseClient");
class SalesService {
    static async getSalesOrders(filters = {}) {
        try {
            let query = supabaseClient_1.supabaseAdmin
                .from('sales_orders')
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
          order_items:order_items (
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
        `);
            if (filters.customer_id) {
                query = query.eq('customer_id', filters.customer_id);
            }
            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            if (filters.date_from) {
                query = query.gte('order_date', filters.date_from);
            }
            if (filters.date_to) {
                query = query.lte('order_date', filters.date_to);
            }
            if (filters.search) {
                query = query.or(`order_number.ilike.%${filters.search}%,customer.first_name.ilike.%${filters.search}%,customer.last_name.ilike.%${filters.search}%`);
            }
            const page = filters.page || 1;
            const limit = filters.limit || 25;
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            query = query.range(from, to).order('order_date', { ascending: false });
            const { data, error, count } = await query;
            if (error)
                throw error;
            return {
                orders: data || [],
                pagination: {
                    page,
                    limit,
                    total: count || 0,
                    pages: Math.ceil((count || 0) / limit)
                }
            };
        }
        catch (error) {
            throw new Error(`Failed to fetch sales orders: ${error}`);
        }
    }
    static async getSalesOrderById(id) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('sales_orders')
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
          created_by:created_by_user_id (
            id,
            first_name,
            last_name
          ),
          order_items:order_items (
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
          ),
          status_history:order_status_history (
            id,
            status,
            notes,
            changed_at,
            changed_by:changed_by_user_id (
              first_name,
              last_name
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
            throw new Error(`Failed to fetch sales order: ${error}`);
        }
    }
    static async createSalesOrder(orderData, items) {
        try {
            const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
            const taxAmount = subtotal * 0.12;
            const totalAmount = subtotal + taxAmount;
            const orderPayload = {
                ...orderData,
                subtotal,
                tax_amount: taxAmount,
                total_amount: totalAmount,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            const { data: order, error: orderError } = await supabaseClient_1.supabaseAdmin
                .from('sales_orders')
                .insert([orderPayload])
                .select()
                .single();
            if (orderError)
                throw orderError;
            const itemsWithOrderId = items.map(item => ({
                ...item,
                order_id: order.id,
                total_price: item.quantity * item.unit_price,
                created_at: new Date().toISOString()
            }));
            const { data: orderItems, error: itemsError } = await supabaseClient_1.supabaseAdmin
                .from('order_items')
                .insert(itemsWithOrderId)
                .select();
            if (itemsError)
                throw itemsError;
            const { error: statusError } = await supabaseClient_1.supabaseAdmin
                .from('order_status_history')
                .insert([{
                    order_id: order.id,
                    status: 'pending',
                    notes: 'Order created',
                    changed_by_user_id: orderData.created_by_user_id,
                    created_at: new Date().toISOString()
                }]);
            if (statusError)
                throw statusError;
            return {
                ...order,
                order_items: orderItems
            };
        }
        catch (error) {
            throw new Error(`Failed to create sales order: ${error}`);
        }
    }
    static async updateSalesOrder(id, orderData) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('sales_orders')
                .update({
                ...orderData,
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
            throw new Error(`Failed to update sales order: ${error}`);
        }
    }
    static async updateOrderStatus(id, status, notes, changedByUserId) {
        try {
            const { data: order, error: orderError } = await supabaseClient_1.supabaseAdmin
                .from('sales_orders')
                .update({
                status,
                updated_at: new Date().toISOString()
            })
                .eq('id', id)
                .select()
                .single();
            if (orderError)
                throw orderError;
            const { error: statusError } = await supabaseClient_1.supabaseAdmin
                .from('order_status_history')
                .insert([{
                    order_id: id,
                    status,
                    notes: notes || `Status changed to ${status}`,
                    changed_by_user_id: changedByUserId,
                    created_at: new Date().toISOString()
                }]);
            if (statusError)
                throw statusError;
            return order;
        }
        catch (error) {
            throw new Error(`Failed to update order status: ${error}`);
        }
    }
    static async getSalesTransactions(filters = {}) {
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
          ),
          payments:payments (
            id,
            payment_method,
            amount,
            payment_date,
            status
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
            const { data, error, count } = await query
                .order('transaction_date', { ascending: false });
            if (error)
                throw error;
            return {
                transactions: data || [],
                total: count || 0
            };
        }
        catch (error) {
            throw new Error(`Failed to fetch sales transactions: ${error}`);
        }
    }
    static async createSalesTransaction(transactionData) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('sales_transactions')
                .insert([transactionData])
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to create sales transaction: ${error}`);
        }
    }
    static async getPayments(filters = {}) {
        try {
            let query = supabaseClient_1.supabaseAdmin
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
            if (error)
                throw error;
            return {
                payments: data || [],
                total: count || 0
            };
        }
        catch (error) {
            throw new Error(`Failed to fetch payments: ${error}`);
        }
    }
    static async createPayment(paymentData) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('payments')
                .insert([paymentData])
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to create payment: ${error}`);
        }
    }
    static async getCustomers(filters = {}) {
        try {
            let query = supabaseClient_1.supabaseAdmin
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
            const page = filters.page || 1;
            const limit = filters.limit || 25;
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            query = query.range(from, to).order('created_at', { ascending: false });
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
            throw new Error(`Failed to fetch customers: ${error}`);
        }
    }
    static async getCustomerById(id) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
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
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to fetch customer: ${error}`);
        }
    }
    static async createCustomer(customerData) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('customers')
                .insert([customerData])
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to create customer: ${error}`);
        }
    }
    static async updateCustomer(id, customerData) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('customers')
                .update(customerData)
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to update customer: ${error}`);
        }
    }
    static async getSalesReport(filters = {}) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .rpc('get_sales_report', {
                p_date_from: filters.date_from,
                p_date_to: filters.date_to,
                p_customer_id: filters.customer_id
            });
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to fetch sales report: ${error}`);
        }
    }
    static async getTopSellingProducts(filters = {}) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .rpc('get_top_selling_products', {
                p_date_from: filters.date_from,
                p_date_to: filters.date_to,
                p_limit: filters.limit || 10
            });
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to fetch top selling products: ${error}`);
        }
    }
    static async getCustomerSalesReport(filters = {}) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .rpc('get_customer_sales_report', {
                p_date_from: filters.date_from,
                p_date_to: filters.date_to,
                p_customer_id: filters.customer_id
            });
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to fetch customer sales report: ${error}`);
        }
    }
    static async getSalesDashboard() {
        try {
            const [totalOrders, totalRevenue, pendingOrders, topProducts] = await Promise.all([
                supabaseClient_1.supabaseAdmin.from('sales_orders').select('id', { count: 'exact' }),
                supabaseClient_1.supabaseAdmin.from('sales_transactions').select('total_amount'),
                supabaseClient_1.supabaseAdmin.from('sales_orders').select('id', { count: 'exact' }).eq('status', 'pending'),
                supabaseClient_1.supabaseAdmin.rpc('get_top_selling_products', { p_limit: 5 })
            ]);
            const totalRevenueAmount = totalRevenue.data?.reduce((sum, t) => sum + t.total_amount, 0) || 0;
            return {
                totalOrders: totalOrders.count || 0,
                totalRevenue: totalRevenueAmount,
                pendingOrders: pendingOrders.count || 0,
                topProducts: topProducts.data || [],
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            throw new Error(`Failed to fetch sales dashboard: ${error}`);
        }
    }
}
exports.SalesService = SalesService;
//# sourceMappingURL=sales.service.js.map