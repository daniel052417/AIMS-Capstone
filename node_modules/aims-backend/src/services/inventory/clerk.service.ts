import { supabaseAdmin } from '../../config/supabaseClient';
import type { 
  Product, 
  Category, 
  Supplier, 
  InventoryTransaction,
  InventoryAdjustment,
  StockMovement,
  PurchaseOrder,
  PurchaseOrderItem,
  StockAlert,
  InventoryCount,
  InventoryCountItem,
} from '@shared/types/database';

export class InventoryClerkService {
  // Dashboard
  static async getDashboard() {
    try {
      const [
        productsResult,
        categoriesResult,
        suppliersResult,
        lowStockResult,
        transactionsResult,
      ] = await Promise.all([
        supabaseAdmin.from('products').select('id', { count: 'exact' }),
        supabaseAdmin.from('categories').select('id', { count: 'exact' }),
        supabaseAdmin.from('suppliers').select('id', { count: 'exact' }),
        supabaseAdmin.from('products').select('id', { count: 'exact' }).lte('stock_quantity', 'minimum_stock'),
        supabaseAdmin.from('inventory_transactions').select('id', { count: 'exact' }),
      ]);

      return {
        totalProducts: productsResult.count || 0,
        totalCategories: categoriesResult.count || 0,
        totalSuppliers: suppliersResult.count || 0,
        lowStockItems: lowStockResult.count || 0,
        totalTransactions: transactionsResult.count || 0,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to fetch inventory dashboard: ${error}`);
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
          pages: Math.ceil((count || 0) / limit),
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch products: ${error}`);
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

  static async createProduct(productData: Partial<Product>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create product: ${error}`);
    }
  }

  static async updateProduct(id: string, productData: Partial<Product>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .update(productData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update product: ${error}`);
    }
  }

  static async deleteProduct(id: string) {
    try {
      const { error } = await supabaseAdmin
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete product: ${error}`);
    }
  }

  // Category Management
  static async getCategories(filters: any = {}) {
    try {
      let query = supabaseAdmin
        .from('categories')
        .select('*');

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
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
        categories: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit),
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch categories: ${error}`);
    }
  }

  static async getCategoryById(id: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch category: ${error}`);
    }
  }

  static async createCategory(categoryData: Partial<Category>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('categories')
        .insert([categoryData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create category: ${error}`);
    }
  }

  static async updateCategory(id: string, categoryData: Partial<Category>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('categories')
        .update(categoryData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update category: ${error}`);
    }
  }

  static async deleteCategory(id: string) {
    try {
      const { error } = await supabaseAdmin
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete category: ${error}`);
    }
  }

  // Supplier Management
  static async getSuppliers(filters: any = {}) {
    try {
      let query = supabaseAdmin
        .from('suppliers')
        .select('*');

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,contact_person.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
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
        suppliers: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit),
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch suppliers: ${error}`);
    }
  }

  static async getSupplierById(id: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch supplier: ${error}`);
    }
  }

  static async createSupplier(supplierData: Partial<Supplier>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('suppliers')
        .insert([supplierData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create supplier: ${error}`);
    }
  }

  static async updateSupplier(id: string, supplierData: Partial<Supplier>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('suppliers')
        .update(supplierData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update supplier: ${error}`);
    }
  }

  static async deleteSupplier(id: string) {
    try {
      const { error } = await supabaseAdmin
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete supplier: ${error}`);
    }
  }

  // Inventory Transactions
  static async getInventoryTransactions(filters: any = {}) {
    try {
      let query = supabaseAdmin
        .from('inventory_transactions')
        .select(`
          *,
          products:product_id (
            name,
            sku
          )
        `);

      if (filters.product_id) {
        query = query.eq('product_id', filters.product_id);
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
          pages: Math.ceil((count || 0) / limit),
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch inventory transactions: ${error}`);
    }
  }

  static async createInventoryTransaction(transactionData: Partial<InventoryTransaction>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('inventory_transactions')
        .insert([transactionData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create inventory transaction: ${error}`);
    }
  }

  // Stock Adjustments
  static async getStockAdjustments(filters: any = {}) {
    try {
      let query = supabaseAdmin
        .from('inventory_adjustments')
        .select(`
          *,
          products:product_id (
            name,
            sku
          )
        `);

      if (filters.product_id) {
        query = query.eq('product_id', filters.product_id);
      }
      if (filters.adjustment_type) {
        query = query.eq('adjustment_type', filters.adjustment_type);
      }
      if (filters.date_from) {
        query = query.gte('adjustment_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('adjustment_date', filters.date_to);
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order('adjustment_date', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        adjustments: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit),
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch stock adjustments: ${error}`);
    }
  }

  static async createStockAdjustment(adjustmentData: Partial<InventoryAdjustment>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('inventory_adjustments')
        .insert([adjustmentData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create stock adjustment: ${error}`);
    }
  }

  // Stock Movements
  static async getStockMovements(filters: any = {}) {
    try {
      let query = supabaseAdmin
        .from('stock_movements')
        .select(`
          *,
          products:product_id (
            name,
            sku
          )
        `);

      if (filters.product_id) {
        query = query.eq('product_id', filters.product_id);
      }
      if (filters.movement_type) {
        query = query.eq('movement_type', filters.movement_type);
      }
      if (filters.date_from) {
        query = query.gte('movement_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('movement_date', filters.date_to);
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order('movement_date', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        movements: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit),
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch stock movements: ${error}`);
    }
  }

  // Purchase Orders
  static async getPurchaseOrders(filters: any = {}) {
    try {
      let query = supabaseAdmin
        .from('purchase_orders')
        .select(`
          *,
          suppliers:supplier_id (
            name
          )
        `);

      if (filters.supplier_id) {
        query = query.eq('supplier_id', filters.supplier_id);
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

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order('order_date', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        purchaseOrders: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit),
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch purchase orders: ${error}`);
    }
  }

  static async getPurchaseOrderById(id: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('purchase_orders')
        .select(`
          *,
          suppliers:supplier_id (
            name
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch purchase order: ${error}`);
    }
  }

  static async createPurchaseOrder(orderData: Partial<PurchaseOrder>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('purchase_orders')
        .insert([orderData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create purchase order: ${error}`);
    }
  }

  static async updatePurchaseOrder(id: string, orderData: Partial<PurchaseOrder>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('purchase_orders')
        .update(orderData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update purchase order: ${error}`);
    }
  }

  // Purchase Order Items
  static async getPurchaseOrderItems(orderId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('purchase_order_items')
        .select(`
          *,
          products:product_id (
            name,
            sku,
            unit_price
          )
        `)
        .eq('purchase_order_id', orderId);

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch purchase order items: ${error}`);
    }
  }

  static async createPurchaseOrderItem(itemData: Partial<PurchaseOrderItem>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('purchase_order_items')
        .insert([itemData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create purchase order item: ${error}`);
    }
  }

  // Stock Alerts
  static async getStockAlerts(filters: any = {}) {
    try {
      let query = supabaseAdmin
        .from('stock_alerts')
        .select(`
          *,
          products:product_id (
            name,
            sku,
            stock_quantity,
            minimum_stock
          )
        `);

      if (filters.alert_type) {
        query = query.eq('alert_type', filters.alert_type);
      }
      if (filters.is_resolved !== undefined) {
        query = query.eq('is_resolved', filters.is_resolved);
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
        alerts: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit),
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch stock alerts: ${error}`);
    }
  }

  static async resolveStockAlert(id: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('stock_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to resolve stock alert: ${error}`);
    }
  }

  // Inventory Counts
  static async getInventoryCounts(filters: any = {}) {
    try {
      let query = supabaseAdmin
        .from('inventory_counts')
        .select('*');

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.date_from) {
        query = query.gte('count_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('count_date', filters.date_to);
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order('count_date', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        counts: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit),
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch inventory counts: ${error}`);
    }
  }

  static async createInventoryCount(countData: Partial<InventoryCount>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('inventory_counts')
        .insert([countData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create inventory count: ${error}`);
    }
  }

  static async getInventoryCountItems(countId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('inventory_count_items')
        .select(`
          *,
          products:product_id (
            name,
            sku,
            unit_price
          )
        `)
        .eq('inventory_count_id', countId);

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch inventory count items: ${error}`);
    }
  }

  static async createInventoryCountItem(itemData: Partial<InventoryCountItem>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('inventory_count_items')
        .insert([itemData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create inventory count item: ${error}`);
    }
  }

  // Reports
  static async getInventoryReport(filters: any = {}) {
    try {
      let query = supabaseAdmin
        .from('products')
        .select(`
          id,
          sku,
          name,
          stock_quantity,
          minimum_stock,
          maximum_stock,
          unit_price,
          categories:category_id (
            name
          ),
          suppliers:supplier_id (
            name
          )
        `);

      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
      }
      if (filters.supplier_id) {
        query = query.eq('supplier_id', filters.supplier_id);
      }
      if (filters.low_stock) {
        query = query.lte('stock_quantity', 'minimum_stock');
      }

      const { data, error } = await query;

      if (error) throw error;

      const totalValue = data?.reduce((sum, product) => 
        sum + (Number(product.stock_quantity) * Number(product.unit_price)), 0) || 0;

      return {
        products: data || [],
        totalValue,
        filters,
      };
    } catch (error) {
      throw new Error(`Failed to fetch inventory report: ${error}`);
    }
  }

  static async getStockMovementReport(filters: any = {}) {
    try {
      let query = supabaseAdmin
        .from('stock_movements')
        .select(`
          *,
          products:product_id (
            name,
            sku
          )
        `);

      if (filters.product_id) {
        query = query.eq('product_id', filters.product_id);
      }
      if (filters.movement_type) {
        query = query.eq('movement_type', filters.movement_type);
      }
      if (filters.date_from) {
        query = query.gte('movement_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('movement_date', filters.date_to);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        movements: data || [],
        filters,
      };
    } catch (error) {
      throw new Error(`Failed to fetch stock movement report: ${error}`);
    }
  }
}