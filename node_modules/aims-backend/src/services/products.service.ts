import { supabaseAdmin } from '../config/supabaseClient';
import type { 
  Product, 
  Category, 
  Supplier, 
  InventoryLevel, 
  InventoryMovement,
  ProductWithDetails 
} from '@shared/types/database';

export class ProductsService {
  // Product Management
  static async getProducts(filters: any = {}) {
    try {
      let query = supabaseAdmin
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
        `);

      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
      }
      if (filters.supplier_id) {
        query = query.eq('supplier_id', filters.supplier_id);
      }
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,barcode.ilike.%${filters.search}%`);
      }
      if (filters.low_stock) {
        // Use RPC function for low stock filtering
        const { data: lowStockData, error: lowStockError } = await supabaseAdmin
          .rpc('get_products_with_low_stock_filter');
        
        if (lowStockError) throw lowStockError;
        return {
          products: lowStockData || [],
          pagination: {
            page: filters.page || 1,
            limit: filters.limit || 25,
            total: lowStockData?.length || 0,
            pages: Math.ceil((lowStockData?.length || 0) / (filters.limit || 25))
          }
        };
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 25;
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
      console.error('Supabase error in getProducts:', error);
      throw new Error(`Failed to fetch products: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    }
  }

  static async getProductById(id: string) {
    try {
      const { data, error } = await supabaseAdmin
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
          ),
          inventory_levels:inventory_levels (
            id,
            location_id,
            quantity_on_hand,
            reserved_quantity,
            reorder_point,
            max_stock_level
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Supabase error in getProductById:', error);
      throw new Error(`Failed to fetch product: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
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
      console.error('Supabase error in createProduct:', error);
      throw new Error(`Failed to create product: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
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
      console.error('Supabase error in updateProduct:', error);
      throw new Error(`Failed to update product: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
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
        .select(`
          *,
          parent_category:parent_id (
            id,
            name
          ),
          child_categories:categories!parent_id (
            id,
            name,
            is_active
          )
        `);

      if (filters.parent_id !== undefined) {
        if (filters.parent_id === null) {
          query = query.is('parent_id', null);
        } else {
          query = query.eq('parent_id', filters.parent_id);
        }
      }
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Failed to fetch categories: ${error}`);
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

      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,contact_person.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Failed to fetch suppliers: ${error}`);
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

  // Inventory Management
  static async getInventoryLevels(filters: any = {}) {
    try {
      let query = supabaseAdmin
        .from('inventory_levels')
        .select(`
          *,
          product:product_id (
            id,
            sku,
            name,
            unit_of_measure
          ),
          location:location_id (
            id,
            name,
            address
          )
        `);

      if (filters.product_id) {
        query = query.eq('product_id', filters.product_id);
      }
      if (filters.location_id) {
        query = query.eq('location_id', filters.location_id);
      }
      if (filters.low_stock) {
        // Use RPC function for low stock inventory levels
        const { data: lowStockData, error: lowStockError } = await supabaseAdmin
          .rpc('get_low_stock_inventory_levels');
        
        if (lowStockError) throw lowStockError;
        return lowStockData || [];
      }

      const { data, error } = await query.order('product_id');

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Failed to fetch inventory levels: ${error}`);
    }
  }

  static async updateInventoryLevel(id: string, levelData: Partial<InventoryLevel>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('inventory_levels')
        .update(levelData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update inventory level: ${error}`);
    }
  }

  static async getInventoryMovements(filters: any = {}) {
    try {
      let query = supabaseAdmin
        .from('inventory_movements')
        .select(`
          *,
          product:product_id (
            id,
            sku,
            name
          ),
          created_by:created_by_user_id (
            first_name,
            last_name
          )
        `);

      if (filters.product_id) {
        query = query.eq('product_id', filters.product_id);
      }
      if (filters.movement_type) {
        query = query.eq('movement_type', filters.movement_type);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Failed to fetch inventory movements: ${error}`);
    }
  }

  static async createInventoryMovement(movementData: Partial<InventoryMovement>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('inventory_movements')
        .insert([movementData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create inventory movement: ${error}`);
    }
  }

  // Stock Management
  static async adjustStock(productId: string, quantity: number, movementType: string, notes?: string, createdByUserId?: string) {
    try {
      // Create inventory movement record
      const movementData = {
        product_id: productId,
        movement_type: movementType,
        quantity: Math.abs(quantity),
        notes: notes,
        created_by_user_id: createdByUserId,
        created_at: new Date().toISOString()
      };

      const movement = await this.createInventoryMovement(movementData);

      // Update product stock quantity
      const { data: product, error: productError } = await supabaseAdmin
        .from('products')
        .select('stock_quantity')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      const newStockQuantity = movementType === 'in' 
        ? product.stock_quantity + quantity
        : product.stock_quantity - quantity;

      const { error: updateError } = await supabaseAdmin
        .from('products')
        .update({ 
          stock_quantity: newStockQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (updateError) throw updateError;

      return {
        movement,
        newStockQuantity
      };
    } catch (error) {
      console.error('Supabase error in adjustStock:', error);
      throw new Error(`Failed to adjust stock: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    }
  }

  // Reports
  static async getLowStockProducts() {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('get_low_stock_products');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Supabase error in getLowStockProducts:', error);
      throw new Error(`Failed to fetch low stock products: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    }
  }

  static async getProductSalesReport(filters: any = {}) {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('get_product_sales_report', {
          p_date_from: filters.date_from,
          p_date_to: filters.date_to,
          p_product_id: filters.product_id
        });

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch product sales report: ${error}`);
    }
  }
}

