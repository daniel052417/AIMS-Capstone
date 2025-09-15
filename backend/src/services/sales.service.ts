import { supabaseAdmin } from '../config/supabaseClient';
import type { 
  SalesOrder, 
  SalesTransaction, 
  OrderItem, 
  OrderStatusHistory,
  Customer,
  Product,
  Payment,
  OrderWithDetails,
} from '@shared/types/database';

export class SalesService {
  // Sales Orders
  static async getSalesOrders(filters: any = {}) {
    try {
      let query = supabaseAdmin
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

      // Apply pagination
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
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit),
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch sales orders: ${error}`);
    }
  }

  static async getSalesOrderById(id: string) {
    try {
      const { data, error } = await supabaseAdmin
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

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch sales order: ${error}`);
    }
  }

  static async createSalesOrder(orderData: Partial<SalesOrder>, items: Partial<OrderItem>[]) {
    try {
      // Input validation
      if (!orderData.customer_id) {
        throw new Error('Customer ID is required');
      }
      if (!items || items.length === 0) {
        throw new Error('At least one item is required');
      }

      // Validate items
      for (const item of items) {
        if (!item.product_id) {
          throw new Error('Product ID is required for all items');
        }
        if (!item.quantity || item.quantity <= 0) {
          throw new Error('Valid quantity is required for all items');
        }
        if (!item.unit_price || item.unit_price <= 0) {
          throw new Error('Valid unit price is required for all items');
        }
      }

      // Generate order number if not provided
      if (!orderData.order_number) {
        try {
          const { data: generatedNumber, error: numberError } = await supabaseAdmin
            .rpc('generate_order_number');
          
          if (numberError) {
            console.error('RPC generate_order_number error:', numberError);
            // Fallback: generate number locally
            orderData.order_number = `ORD-${Date.now().toString().slice(-4)}`;
          } else {
            orderData.order_number = generatedNumber;
          }
        } catch (rpcError) {
          console.error('RPC generate_order_number failed:', rpcError);
          // Fallback: generate number locally
          orderData.order_number = `ORD-${Date.now().toString().slice(-4)}`;
        }
      }

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const taxAmount = subtotal * 0.12; // 12% VAT
      const totalAmount = subtotal + taxAmount;

      // Prepare order data
      const orderPayload = {
        order_number: orderData.order_number,
        customer_id: orderData.customer_id,
        staff_id: orderData.staff_id,
        branch_id: orderData.branch_id,
        order_date: orderData.order_date || new Date().toISOString(),
        required_date: orderData.required_date,
        shipped_date: orderData.shipped_date,
        status: orderData.status || 'pending',
        subtotal,
        discount_amount: orderData.discount_amount || 0,
        tax_amount: taxAmount,
        shipping_amount: orderData.shipping_amount || 0,
        total_amount: totalAmount,
        shipping_address: orderData.shipping_address,
        notes: orderData.notes,
        payment_method: orderData.payment_method,
        payment_status: orderData.payment_status || 'pending',
        created_by_user_id: orderData.created_by_user_id,
      };

      // Prepare items data
      const itemsData = items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percentage: item.discount_percentage || 0,
        total_price: item.quantity * item.unit_price,
      }));

      // Prepare status data
      const statusData = {
        status: 'pending',
        notes: 'Order created',
        changed_by_user_id: orderData.created_by_user_id,
      };

      // Use RPC transaction function
      const { data, error } = await supabaseAdmin
        .rpc('create_sales_order_transaction', {
          p_order_data: orderPayload,
          p_items_data: itemsData,
          p_status_data: statusData,
        });

      if (error) {
        console.error('Supabase error in createSalesOrder:', JSON.stringify(error, null, 2));
        throw new Error(`Failed to create sales order: ${error.message || JSON.stringify(error)}`);
      }

      return data;
    } catch (error) {
      console.error('Error in createSalesOrder:', error);
      throw new Error(`Failed to create sales order: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    }
  }

  static async updateSalesOrder(id: string, orderData: Partial<SalesOrder>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('sales_orders')
        .update({
          ...orderData,
          updated_at: new Date().toISOString(),
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
      // Update order status
      const { data: order, error: orderError } = await supabaseAdmin
        .from('sales_orders')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (orderError) throw orderError;

      // Add status history entry
      const { error: statusError } = await supabaseAdmin
        .from('order_status_history')
        .insert([{
          order_id: id,
          status,
          notes: notes || `Status changed to ${status}`,
          changed_by_user_id: changedByUserId,
          created_at: new Date().toISOString(),
        }]);

      if (statusError) throw statusError;

      return order;
    } catch (error) {
      throw new Error(`Failed to update order status: ${error}`);
    }
  }

  // Sales Transactions
  static async getSalesTransactions(filters: any = {}) {
    try {
      let query = supabaseAdmin
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

      if (error) throw error;

      return {
        transactions: data || [],
        total: count || 0,
      };
    } catch (error) {
      throw new Error(`Failed to fetch sales transactions: ${error}`);
    }
  }

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
        customer_type: customerData.customer_type || 'individual',
        registration_date: customerData.registration_date || new Date().toISOString().split('T')[0],
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

