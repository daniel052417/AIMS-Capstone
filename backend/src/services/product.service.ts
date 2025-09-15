import { BaseCRUDService } from './base-crud.service';
import { Product, ProductVariant, Category, ProductCreateRequest, ProductUpdateRequest } from '../types/product';
import { CRUDResponse, PaginatedResponse, PaginationParams, FilterParams } from '../types/crud';
import { supabaseAdmin } from '../config/supabaseClient';

export class ProductsService extends BaseCRUDService<Product> {
  constructor() {
    super('products');
  }

  // Override create to add custom validation
  async create(data: ProductCreateRequest): Promise<CRUDResponse<Product>> {
    try {
      // Check if SKU already exists
      const { data: existingProduct } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('sku', data.sku)
        .single();

      if (existingProduct) {
        return {
          success: false,
          message: 'Product with this SKU already exists'
        };
      }

      // Check if category exists
      const { data: category } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('id', data.category_id)
        .eq('is_active', true)
        .single();

      if (!category) {
        return {
          success: false,
          message: 'Category not found or inactive'
        };
      }

      // Check if unit of measure exists
      const { data: unit } = await supabaseAdmin
        .from('units_of_measure')
        .select('id')
        .eq('id', data.unit_of_measure_id)
        .eq('is_active', true)
        .single();

      if (!unit) {
        return {
          success: false,
          message: 'Unit of measure not found or inactive'
        };
      }

      // Validate price
      if (data.selling_price <= data.purchase_price) {
        return {
          success: false,
          message: 'Selling price must be greater than purchase price'
        };
      }

      // Validate stock levels
      if (data.min_stock_level >= data.max_stock_level) {
        return {
          success: false,
          message: 'Minimum stock level must be less than maximum stock level'
        };
      }

      return super.create(data);
    } catch (error: any) {
      console.error('Create product error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create product'
      };
    }
  }

  // Get products with category and unit information
  async getProductsWithDetails(
    pagination: PaginationParams = {},
    filters: FilterParams = {}
  ): Promise<PaginatedResponse<any>> {
    try {
      const {
        page = 1,
        limit = 10,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = pagination;

      const offset = (page - 1) * limit;

      let query = supabaseAdmin
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
        `, { count: 'exact' });

      // Apply filters
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,barcode.ilike.%${filters.search}%`);
      }

      if (filters.status) {
        query = query.eq('is_active', filters.status === 'active');
      }

      if (filters.branch_id) {
        query = query.eq('branch_id', filters.branch_id);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      // Apply sorting and pagination
      query = query
        .order(sort_by, { ascending: sort_order === 'asc' })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        message: 'Products retrieved successfully',
        data: data || [],
        pagination: {
          page,
          limit,
          total,
          total_pages: totalPages,
          has_next: page < totalPages,
          has_prev: page > 1
        }
      };
    } catch (error: any) {
      console.error('Get products with details error:', error);
      return {
        success: false,
        message: error.message || 'Failed to retrieve products',
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          total_pages: 0,
          has_next: false,
          has_prev: false
        }
      };
    }
  }

  // Get product variants
  async getProductVariants(productId: string): Promise<CRUDResponse<ProductVariant[]>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      return {
        success: true,
        message: 'Product variants retrieved successfully',
        data: data || []
      };
    } catch (error: any) {
      console.error('Get product variants error:', error);
      return {
        success: false,
        message: error.message || 'Failed to retrieve product variants'
      };
    }
  }

  // Create product variant
  async createVariant(productId: string, variantData: Partial<ProductVariant>): Promise<CRUDResponse<ProductVariant>> {
    try {
      // Check if product exists
      const { data: product } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('id', productId)
        .single();

      if (!product) {
        return {
          success: false,
          message: 'Product not found'
        };
      }

      // Check if variant SKU already exists
      const { data: existingVariant } = await supabaseAdmin
        .from('product_variants')
        .select('id')
        .eq('sku', variantData.sku)
        .single();

      if (existingVariant) {
        return {
          success: false,
          message: 'Variant with this SKU already exists'
        };
      }

      const { data: result, error } = await supabaseAdmin
        .from('product_variants')
        .insert({
          ...variantData,
          product_id: productId
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        message: 'Product variant created successfully',
        data: result
      };
    } catch (error: any) {
      console.error('Create product variant error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create product variant'
      };
    }
  }

  // Get categories
  async getCategories(): Promise<CRUDResponse<Category[]>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      return {
        success: true,
        message: 'Categories retrieved successfully',
        data: data || []
      };
    } catch (error: any) {
      console.error('Get categories error:', error);
      return {
        success: false,
        message: error.message || 'Failed to retrieve categories'
      };
    }
  }

  // Search products
  async searchProducts(searchTerm: string, branchId?: string): Promise<CRUDResponse<Product[]>> {
    try {
      let query = supabaseAdmin
        .from('products')
        .select(`
          *,
          categories (
            id,
            name
          ),
          units_of_measure (
            id,
            name,
            abbreviation
          )
        `)
        .eq('is_active', true)
        .or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`)
        .limit(20);

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        message: 'Products found successfully',
        data: data || []
      };
    } catch (error: any) {
      console.error('Search products error:', error);
      return {
        success: false,
        message: error.message || 'Failed to search products'
      };
    }
  }
}