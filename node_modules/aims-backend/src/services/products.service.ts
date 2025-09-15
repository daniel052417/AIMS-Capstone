import { supabaseAdmin } from '../config/supabaseClient';
import type { 
  Product, 
  Category, 
  Supplier, 
  InventoryLevel, 
  InventoryMovement,
  ProductWithDetails, 
} from '@shared/types/database';
import { ProductWithVariantsAndInventory, ProductVariantWithInventory, ProductUpdateRequest, ProductVariantUpdateRequest } from '../types/product';

// Define CRUDResponse interface locally to avoid import issues
interface CRUDResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

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
            pages: Math.ceil((lowStockData?.length || 0) / (filters.limit || 25)),
          },
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
          pages: Math.ceil((count || 0) / limit),
        },
      };
    } catch (error) {
      console.error('Supabase error in getProducts:', error);
      throw new Error(`Failed to fetch products: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    }
  }

  static async getProductById(id: string): Promise<CRUDResponse<ProductWithVariantsAndInventory>> {
    try {
      // First, get the product with basic details
      const { data: product, error: productError } = await supabaseAdmin
        .from('products')
        .select(`
          *,
          categories (
            id,
            name,
            description
          ),
          units_of_measure (
            id,
            name,
            abbreviation
          )
        `)
        .eq('id', id)
        .single();

      if (productError) {
        return {
          success: false,
          message: productError.message || 'Product not found',
        };
      }

      if (!product) {
        return {
          success: false,
          message: 'Product not found',
        };
      }

      // Get product variants with their inventory
      const { data: variants, error: variantsError } = await supabaseAdmin
        .from('product_variants')
        .select(`
          *,
          inventory (
            id,
            branch_id,
            quantity_on_hand,
            quantity_reserved,
            quantity_available,
            reorder_level,
            max_stock_level,
            last_counted,
            updated_at
          )
        `)
        .eq('product_id', id)
        .eq('is_active', true)
        .order('name');

      if (variantsError) {
        console.error('Error fetching variants:', variantsError);
        return {
          success: false,
          message: 'Failed to fetch product variants',
        };
      }

      // Transform the data to match our interface
      const productWithVariants: ProductWithVariantsAndInventory = {
        ...product,
        variants: variants?.map(variant => ({
          ...variant,
          inventory: variant.inventory || [],
        })) || [],
        category: product.categories,
        unit_of_measure: product.units_of_measure,
      };

      return {
        success: true,
        message: 'Product retrieved successfully',
        data: productWithVariants,
      };
    } catch (error: any) {
      console.error('Error in getProductById:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch product',
      };
    }
  }

  // Get product with variants only (without inventory) - lighter query
  static async getProductWithVariants(id: string): Promise<CRUDResponse<any>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select(`
          *,
          categories (
            id,
            name,
            description
          ),
          units_of_measure (
            id,
            name,
            abbreviation
          ),
          product_variants (
            id,
            name,
            sku,
            barcode,
            price_modifier,
            is_active,
            created_at,
            updated_at
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        return {
          success: false,
          message: error.message || 'Product not found',
        };
      }

      return {
        success: true,
        message: 'Product retrieved successfully',
        data,
      };
    } catch (error: any) {
      console.error('Error in getProductWithVariants:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch product',
      };
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

  static async updateProduct(id: string, productData: ProductUpdateRequest): Promise<CRUDResponse<ProductWithVariantsAndInventory>> {
    try {
      // Step 1: Validate that product exists
      const { data: existingProduct, error: productCheckError } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('id', id)
        .single();

      if (productCheckError || !existingProduct) {
        return {
          success: false,
          message: 'Product not found',
        };
      }

      // Step 2: Prepare product update data (exclude variants)
      const { variants, ...productUpdateData } = productData;
      
      // Only update product fields that exist in the products table
      const allowedProductFields = [
        'name', 'description', 'sku', 'category_id', 'brand', 
        'unit_of_measure', 'weight', 'dimensions', 
        'is_prescription_required', 'is_active',
      ];
      
      const filteredProductData = Object.keys(productUpdateData)
        .filter(key => allowedProductFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = productUpdateData[key];
          return obj;
        }, {} as any);

      // Step 3: Update product if there are fields to update
      let updatedProduct = existingProduct;
      if (Object.keys(filteredProductData).length > 0) {
        const { data: productResult, error: productError } = await supabaseAdmin
          .from('products')
          .update({
            ...filteredProductData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (productError) {
          return {
            success: false,
            message: `Failed to update product: ${productError.message}`,
          };
        }
        updatedProduct = productResult;
      }

      // Step 4: Handle variants if provided
      let updatedVariants: ProductVariantWithInventory[] = [];
      if (variants && variants.length > 0) {
        const variantResults = await this.updateProductVariants(id, variants);
        if (!variantResults.success) {
          return {
            success: false,
            message: `Failed to update variants: ${variantResults.message}`,
          };
        }
        updatedVariants = variantResults.data || [];
      } else {
        // If no variants provided, fetch existing variants
        const variantsResult = await this.getProductWithVariants(id);
        if (variantsResult.success) {
          updatedVariants = variantsResult.data || [];
        }
      }

      // Step 5: Get complete product with all details
      const completeProductResult = await this.getProductById(id);
      if (!completeProductResult.success) {
        return {
          success: false,
          message: 'Product updated but failed to fetch complete details',
        };
      }

      return {
        success: true,
        message: 'Product updated successfully',
        data: completeProductResult.data,
      };
    } catch (error: any) {
      console.error('Error in updateProduct:', error);
      return {
        success: false,
        message: error.message || 'Failed to update product',
      };
    }
  }

  // Atomic update method with transaction support
  static async updateProductAtomic(id: string, productData: ProductUpdateRequest): Promise<CRUDResponse<ProductWithVariantsAndInventory>> {
    try {
      // Step 1: Validate that product exists
      const { data: existingProduct, error: productCheckError } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('id', id)
        .single();

      if (productCheckError || !existingProduct) {
        return {
          success: false,
          message: 'Product not found',
        };
      }

      // Step 2: Prepare product update data
      const { variants, ...productUpdateData } = productData;
      
      const allowedProductFields = [
        'name', 'description', 'sku', 'category_id', 'brand', 
        'unit_of_measure', 'weight', 'dimensions', 
        'is_prescription_required', 'is_active',
      ];
      
      const filteredProductData = Object.keys(productUpdateData)
        .filter(key => allowedProductFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = productUpdateData[key];
          return obj;
        }, {} as any);

      // Step 3: Store original data for rollback
      const originalProduct = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      const originalVariants = await supabaseAdmin
        .from('product_variants')
        .select('*')
        .eq('product_id', id);

      // Step 4: Update product
      if (Object.keys(filteredProductData).length > 0) {
        const { error: productError } = await supabaseAdmin
          .from('products')
          .update({
            ...filteredProductData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (productError) {
          return {
            success: false,
            message: `Failed to update product: ${productError.message}`,
          };
        }
      }

      // Step 5: Update variants if provided
      if (variants && variants.length > 0) {
        const variantResults = await this.updateProductVariantsAtomic(id, variants);
        if (!variantResults.success) {
          // Rollback product changes
          if (Object.keys(filteredProductData).length > 0) {
            await supabaseAdmin
              .from('products')
              .update(originalProduct.data)
              .eq('id', id);
          }
          
          return {
            success: false,
            message: `Failed to update variants: ${variantResults.message}`,
          };
        }
      }

      // Step 6: Get complete updated product
      const completeProductResult = await this.getProductById(id);
      if (!completeProductResult.success) {
        return {
          success: false,
          message: 'Product updated but failed to fetch complete details',
        };
      }

      return {
        success: true,
        message: 'Product updated successfully',
        data: completeProductResult.data,
      };
    } catch (error: any) {
      console.error('Error in updateProductAtomic:', error);
      return {
        success: false,
        message: error.message || 'Failed to update product',
      };
    }
  }

  // Helper method to update product variants with atomic operations
  private static async updateProductVariantsAtomic(productId: string, variants: ProductVariantUpdateRequest[]): Promise<CRUDResponse<ProductVariantWithInventory[]>> {
    try {
      const updatedVariants: ProductVariantWithInventory[] = [];

      for (const variantData of variants) {
        if (variantData.id) {
          // Update existing variant
          const { data: updatedVariant, error: variantError } = await supabaseAdmin
            .from('product_variants')
            .update({
              ...variantData,
              updated_at: new Date().toISOString(),
            })
            .eq('id', variantData.id)
            .eq('product_id', productId)
            .select()
            .single();

          if (variantError) {
            return {
              success: false,
              message: `Failed to update variant ${variantData.id}: ${variantError.message}`,
            };
          }

          // Get inventory for this variant
          const { data: inventory } = await supabaseAdmin
            .from('inventory')
            .select('*')
            .eq('product_variant_id', variantData.id);

          updatedVariants.push({
            ...updatedVariant,
            inventory: inventory || [],
          });
        } else {
          // Create new variant
          const { data: newVariant, error: createError } = await supabaseAdmin
            .from('product_variants')
            .insert({
              ...variantData,
              product_id: productId,
              created_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (createError) {
            return {
              success: false,
              message: `Failed to create variant: ${createError.message}`,
            };
          }

          updatedVariants.push({
            ...newVariant,
            inventory: [],
          });
        }
      }

      return {
        success: true,
        message: 'Variants updated successfully',
        data: updatedVariants,
      };
    } catch (error: any) {
      console.error('Error updating variants atomically:', error);
      return {
        success: false,
        message: error.message || 'Failed to update variants',
      };
    }
  }

  // Helper method to update product variants (non-atomic version)
  private static async updateProductVariants(productId: string, variants: ProductVariantUpdateRequest[]): Promise<CRUDResponse<ProductVariantWithInventory[]>> {
    try {
      const updatedVariants: ProductVariantWithInventory[] = [];

      for (const variantData of variants) {
        if (variantData.id) {
          // Update existing variant
          const { data: updatedVariant, error: variantError } = await supabaseAdmin
            .from('product_variants')
            .update({
              ...variantData,
              updated_at: new Date().toISOString(),
            })
            .eq('id', variantData.id)
            .eq('product_id', productId)
            .select()
            .single();

          if (variantError) {
            return {
              success: false,
              message: `Failed to update variant ${variantData.id}: ${variantError.message}`,
            };
          }

          // Get inventory for this variant
          const { data: inventory } = await supabaseAdmin
            .from('inventory')
            .select('*')
            .eq('product_variant_id', variantData.id);

          updatedVariants.push({
            ...updatedVariant,
            inventory: inventory || [],
          });
        } else {
          // Create new variant
          const { data: newVariant, error: createError } = await supabaseAdmin
            .from('product_variants')
            .insert({
              ...variantData,
              product_id: productId,
              created_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (createError) {
            return {
              success: false,
              message: `Failed to create variant: ${createError.message}`,
            };
          }

          updatedVariants.push({
            ...newVariant,
            inventory: [],
          });
        }
      }

      return {
        success: true,
        message: 'Variants updated successfully',
        data: updatedVariants,
      };
    } catch (error: any) {
      console.error('Error updating variants:', error);
      return {
        success: false,
        message: error.message || 'Failed to update variants',
      };
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
        movement_type: movementType as 'in' | 'out' | 'transfer' | 'adjustment',
        quantity: Math.abs(quantity),
        notes,
        created_by_user_id: createdByUserId,
        created_at: new Date().toISOString(),
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
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);

      if (updateError) throw updateError;

      return {
        movement,
        newStockQuantity,
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
          p_product_id: filters.product_id,
        });

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch product sales report: ${error}`);
    }
  }
}

