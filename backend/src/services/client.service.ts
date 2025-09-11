import { supabaseAdmin } from '../config/supabaseClient';

export class ClientService {
  static async getDashboard() {
    const [productsResult, categoriesResult, campaignsResult, ordersResult] = await Promise.all([
      supabaseAdmin.from('products').select('id', { count: 'exact' }).eq('is_active', true),
      supabaseAdmin.from('categories').select('id', { count: 'exact' }).eq('is_active', true),
      supabaseAdmin.from('marketing_campaigns').select('id', { count: 'exact' }).eq('is_active', true),
      supabaseAdmin.from('sales_orders').select('id', { count: 'exact' })
    ]);

    return {
      totalProducts: productsResult.count || 0,
      totalCategories: categoriesResult.count || 0,
      activeCampaigns: campaignsResult.count || 0,
      totalOrders: ordersResult.count || 0,
      timestamp: new Date().toISOString()
    };
  }

  static async getProducts(filters: any = {}) {
    let query = supabaseAdmin
      .from('products')
      .select('id, sku, name, description, unit_price, stock_quantity, image_url, unit_of_measure, categories:category_id (name), suppliers:supplier_id (name)')
      .eq('is_active', true);

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
    }
    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }
    if (filters.min_price) {
      query = query.gte('unit_price', filters.min_price);
    }
    if (filters.max_price) {
      query = query.lte('unit_price', filters.max_price);
    }
    if (filters.in_stock) {
      query = query.gt('stock_quantity', 0);
    }

    const page = filters.page || 1;
    const limit = filters.limit || 12;
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
  }

  static async getProductById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*, categories:category_id (name), suppliers:supplier_id (name)')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  }

  static async searchProducts(searchTerm: string) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('id, sku, name, unit_price, image_url, stock_quantity')
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`)
      .eq('is_active', true)
      .limit(20);

    if (error) throw error;
    return data;
  }

  static async getCategories() {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('id, name, description, image_url')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data;
  }

  static async getCategoryById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  }

  static async getCustomerById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async createCustomer(customerData: any) {
    const { data, error } = await supabaseAdmin
      .from('customers')
      .insert([customerData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateCustomer(id: string, customerData: any) {
    const { data, error } = await supabaseAdmin
      .from('customers')
      .update(customerData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getOrders(customerId: string, filters: any = {}) {
    let query = supabaseAdmin
      .from('sales_orders')
      .select('*, order_items:order_items (id, product_id, quantity, unit_price, total_price, products:product_id (name, sku))')
      .eq('customer_id', customerId);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.date_from) {
      query = query.gte('order_date', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('order_date', filters.date_to);
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
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
        pages: Math.ceil((count || 0) / limit)
      }
    };
  }

  static async getOrderById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('sales_orders')
      .select('*, order_items:order_items (id, product_id, quantity, unit_price, total_price, products:product_id (name, sku, image_url)), customers:customer_id (first_name, last_name, email, phone)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async createOrder(orderData: any) {
    const { data, error } = await supabaseAdmin
      .from('sales_orders')
      .insert([orderData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateOrder(id: string, orderData: any) {
    const { data, error } = await supabaseAdmin
      .from('sales_orders')
      .update(orderData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async cancelOrder(id: string) {
    const { data, error } = await supabaseAdmin
      .from('sales_orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getOrderItems(orderId: string) {
    const { data, error } = await supabaseAdmin
      .from('order_items')
      .select('*, products:product_id (name, sku, image_url)')
      .eq('order_id', orderId);

    if (error) throw error;
    return data;
  }

  static async createOrderItem(itemData: any) {
    const { data, error } = await supabaseAdmin
      .from('order_items')
      .insert([itemData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateOrderItem(id: string, itemData: any) {
    const { data, error } = await supabaseAdmin
      .from('order_items')
      .update(itemData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteOrderItem(id: string) {
    const { error } = await supabaseAdmin
      .from('order_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  }

  static async createSalesTransaction(transactionData: any) {
    const { data, error } = await supabaseAdmin
      .from('sales_transactions')
      .insert([transactionData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getSalesTransactionById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('sales_transactions')
      .select('*, customers:customer_id (first_name, last_name, email)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async processPayment(paymentData: any) {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .insert([paymentData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getPayments(transactionId: string) {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('transaction_id', transactionId)
      .order('payment_date', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async getActiveCampaigns() {
    const { data, error } = await supabaseAdmin
      .from('marketing_campaigns')
      .select('id, campaign_name, title, description, content, background_color, text_color, image_url, cta_text, cta_url, cta_button_color, cta_text_color, target_audience, target_channels, publish_date, unpublish_date')
      .eq('is_active', true)
      .lte('publish_date', new Date().toISOString())
      .or(`unpublish_date.is.null,unpublish_date.gte.${new Date().toISOString()}`)
      .order('publish_date', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async getCampaignById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('marketing_campaigns')
      .select('*, campaign_templates:template_id (name, template_type)')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  }

  static async getFeaturedProducts() {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('id, sku, name, unit_price, image_url, stock_quantity')
      .eq('is_active', true)
      .gt('stock_quantity', 0)
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) throw error;
    return data;
  }

  static async getNewArrivals() {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('id, sku, name, unit_price, image_url, stock_quantity')
      .eq('is_active', true)
      .gt('stock_quantity', 0)
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) throw error;
    return data;
  }

  static async getBestSellers() {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('id, sku, name, unit_price, image_url, stock_quantity')
      .eq('is_active', true)
      .gt('stock_quantity', 0)
      .order('total_sold', { ascending: false })
      .limit(8);

    if (error) throw error;
    return data;
  }
}