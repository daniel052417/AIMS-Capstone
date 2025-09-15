# 04 - CRUD Modules Implementation Guide

## Overview
This guide will show you how to implement CRUD operations for your AIMS backend using the established patterns from auth and RBAC modules.

## Prerequisites
- ✅ Backend setup completed (01_backend_setup.md)
- ✅ Authentication module completed (02_auth_module.md)
- ✅ RBAC module completed (03_role_permission_module.md)
- ✅ Database schema modules executed

## Step 1: CRUD Types

### 1.1 Create Common CRUD Types
**File: `src/types/crud.ts`**
```typescript
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface FilterParams {
  search?: string;
  status?: string;
  branch_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface CRUDResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export interface BulkOperationResult {
  success: boolean;
  message: string;
  data: {
    successful: number;
    failed: number;
    errors: Array<{
      index: number;
      error: string;
    }>;
  };
}
```

## Step 2: Base CRUD Service

### 2.1 Create Base CRUD Service
**File: `src/services/base-crud.service.ts`**
```typescript
import { supabaseAdmin } from '../config/supabaseClient';
import { PaginationParams, FilterParams, CRUDResponse, PaginatedResponse } from '../types/crud';

export abstract class BaseCRUDService<T> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  // Create
  async create(data: Partial<T>): Promise<CRUDResponse<T>> {
    try {
      const { data: result, error } = await supabaseAdmin
        .from(this.tableName)
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        message: `${this.tableName} created successfully`,
        data: result
      };
    } catch (error: any) {
      console.error(`Create ${this.tableName} error:`, error);
      return {
        success: false,
        message: error.message || `Failed to create ${this.tableName}`
      };
    }
  }

  // Read by ID
  async getById(id: string): Promise<CRUDResponse<T>> {
    try {
      const { data: result, error } = await supabaseAdmin
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!result) {
        return {
          success: false,
          message: `${this.tableName} not found`
        };
      }

      return {
        success: true,
        message: `${this.tableName} retrieved successfully`,
        data: result
      };
    } catch (error: any) {
      console.error(`Get ${this.tableName} by ID error:`, error);
      return {
        success: false,
        message: error.message || `Failed to retrieve ${this.tableName}`
      };
    }
  }

  // Read all with pagination and filters
  async getAll(
    pagination: PaginationParams = {},
    filters: FilterParams = {}
  ): Promise<PaginatedResponse<T>> {
    try {
      const {
        page = 1,
        limit = 10,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = pagination;

      const offset = (page - 1) * limit;

      let query = supabaseAdmin
        .from(this.tableName)
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
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
        message: `${this.tableName} retrieved successfully`,
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
      console.error(`Get all ${this.tableName} error:`, error);
      return {
        success: false,
        message: error.message || `Failed to retrieve ${this.tableName}`,
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

  // Update
  async update(id: string, data: Partial<T>): Promise<CRUDResponse<T>> {
    try {
      const { data: result, error } = await supabaseAdmin
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (!result) {
        return {
          success: false,
          message: `${this.tableName} not found`
        };
      }

      return {
        success: true,
        message: `${this.tableName} updated successfully`,
        data: result
      };
    } catch (error: any) {
      console.error(`Update ${this.tableName} error:`, error);
      return {
        success: false,
        message: error.message || `Failed to update ${this.tableName}`
      };
    }
  }

  // Delete
  async delete(id: string): Promise<CRUDResponse> {
    try {
      const { error } = await supabaseAdmin
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return {
        success: true,
        message: `${this.tableName} deleted successfully`
      };
    } catch (error: any) {
      console.error(`Delete ${this.tableName} error:`, error);
      return {
        success: false,
        message: error.message || `Failed to delete ${this.tableName}`
      };
    }
  }

  // Soft delete (if table has is_active column)
  async softDelete(id: string): Promise<CRUDResponse> {
    try {
      const { data: result, error } = await supabaseAdmin
        .from(this.tableName)
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (!result) {
        return {
          success: false,
          message: `${this.tableName} not found`
        };
      }

      return {
        success: true,
        message: `${this.tableName} deactivated successfully`,
        data: result
      };
    } catch (error: any) {
      console.error(`Soft delete ${this.tableName} error:`, error);
      return {
        success: false,
        message: error.message || `Failed to deactivate ${this.tableName}`
      };
    }
  }

  // Restore (if table has is_active column)
  async restore(id: string): Promise<CRUDResponse<T>> {
    try {
      const { data: result, error } = await supabaseAdmin
        .from(this.tableName)
        .update({ is_active: true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (!result) {
        return {
          success: false,
          message: `${this.tableName} not found`
        };
      }

      return {
        success: true,
        message: `${this.tableName} restored successfully`,
        data: result
      };
    } catch (error: any) {
      console.error(`Restore ${this.tableName} error:`, error);
      return {
        success: false,
        message: error.message || `Failed to restore ${this.tableName}`
      };
    }
  }
}
```

## Step 3: Example - Products CRUD

### 3.1 Create Product Types
**File: `src/types/product.ts`**
```typescript
export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  category_id: string;
  unit_of_measure_id: string;
  purchase_price: number;
  selling_price: number;
  min_stock_level: number;
  max_stock_level: number;
  is_active: boolean;
  branch_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku: string;
  barcode?: string;
  price_modifier: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductCreateRequest {
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  category_id: string;
  unit_of_measure_id: string;
  purchase_price: number;
  selling_price: number;
  min_stock_level: number;
  max_stock_level: number;
  branch_id?: string;
}

export interface ProductUpdateRequest {
  name?: string;
  description?: string;
  sku?: string;
  barcode?: string;
  category_id?: string;
  unit_of_measure_id?: string;
  purchase_price?: number;
  selling_price?: number;
  min_stock_level?: number;
  max_stock_level?: number;
  is_active?: boolean;
}
```

### 3.2 Create Product Service
**File: `src/services/products.service.ts`**
```typescript
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
```

### 3.3 Create Product Controller
**File: `src/controllers/products.controller.ts`**
```typescript
import { Request, Response } from 'express';
import { ProductsService } from '../services/products.service';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

export class ProductsController {
  private static productsService = new ProductsService();

  // Create product
  static create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await ProductsController.productsService.create(req.body);
    res.status(result.success ? 201 : 400).json(result);
  });

  // Get product by ID
  static getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ProductsController.productsService.getById(id);
    res.status(result.success ? 200 : 404).json(result);
  });

  // Get all products with pagination and filters
  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const pagination = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sort_by: req.query.sort_by as string || 'created_at',
      sort_order: (req.query.sort_order as 'asc' | 'desc') || 'desc'
    };

    const filters = {
      search: req.query.search as string,
      status: req.query.status as string,
      branch_id: req.query.branch_id as string,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string
    };

    const result = await ProductsController.productsService.getProductsWithDetails(pagination, filters);
    res.status(result.success ? 200 : 400).json(result);
  });

  // Update product
  static update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const result = await ProductsController.productsService.update(id, req.body);
    res.status(result.success ? 200 : 400).json(result);
  });

  // Delete product
  static delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const result = await ProductsController.productsService.delete(id);
    res.status(result.success ? 200 : 400).json(result);
  });

  // Soft delete product
  static softDelete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const result = await ProductsController.productsService.softDelete(id);
    res.status(result.success ? 200 : 400).json(result);
  });

  // Restore product
  static restore = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const result = await ProductsController.productsService.restore(id);
    res.status(result.success ? 200 : 400).json(result);
  });

  // Get product variants
  static getVariants = asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const result = await ProductsController.productsService.getProductVariants(productId);
    res.status(result.success ? 200 : 400).json(result);
  });

  // Create product variant
  static createVariant = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { productId } = req.params;
    const result = await ProductsController.productsService.createVariant(productId, req.body);
    res.status(result.success ? 201 : 400).json(result);
  });

  // Get categories
  static getCategories = asyncHandler(async (req: Request, res: Response) => {
    const result = await ProductsController.productsService.getCategories();
    res.status(result.success ? 200 : 400).json(result);
  });

  // Search products
  static search = asyncHandler(async (req: Request, res: Response) => {
    const { q } = req.query;
    const branchId = req.query.branch_id as string;

    if (!q) {
      res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
      return;
    }

    const result = await ProductsController.productsService.searchProducts(q as string, branchId);
    res.status(result.success ? 200 : 400).json(result);
  });
}
```

### 3.4 Create Product Routes
**File: `src/routes/products.routes.ts`**
```typescript
import { Router } from 'express';
import { ProductsController } from '../controllers/products.controller';
import { authenticateToken, requirePermission } from '../middleware/auth';
import { requirePermission as requirePerm } from '../middleware/rbac';

const router = Router();

// Public routes (no authentication required)
router.get('/categories', ProductsController.getCategories);
router.get('/search', ProductsController.search);

// Protected routes
router.use(authenticateToken);

// Product CRUD operations
router.post('/', 
  requirePerm('products', 'create'),
  ProductsController.create
);

router.get('/', 
  requirePerm('products', 'read'),
  ProductsController.getAll
);

router.get('/:id', 
  requirePerm('products', 'read'),
  ProductsController.getById
);

router.put('/:id', 
  requirePerm('products', 'update'),
  ProductsController.update
);

router.delete('/:id', 
  requirePerm('products', 'delete'),
  ProductsController.delete
);

router.patch('/:id/soft-delete', 
  requirePerm('products', 'delete'),
  ProductsController.softDelete
);

router.patch('/:id/restore', 
  requirePerm('products', 'update'),
  ProductsController.restore
);

// Product variants
router.get('/:productId/variants', 
  requirePerm('products', 'read'),
  ProductsController.getVariants
);

router.post('/:productId/variants', 
  requirePerm('products', 'create'),
  ProductsController.createVariant
);

export default router;
```

## Step 4: Validation Schemas

### 4.1 Create Product Validation
**File: `src/utils/product-validation.ts`**
```typescript
import Joi from 'joi';

export const productValidation = {
  create: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Product name must be at least 2 characters long',
        'string.max': 'Product name must not exceed 100 characters',
        'any.required': 'Product name is required'
      }),
    description: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.max': 'Description must not exceed 500 characters'
      }),
    sku: Joi.string()
      .min(3)
      .max(50)
      .required()
      .messages({
        'string.min': 'SKU must be at least 3 characters long',
        'string.max': 'SKU must not exceed 50 characters',
        'any.required': 'SKU is required'
      }),
    barcode: Joi.string()
      .min(8)
      .max(20)
      .optional()
      .messages({
        'string.min': 'Barcode must be at least 8 characters long',
        'string.max': 'Barcode must not exceed 20 characters'
      }),
    category_id: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.guid': 'Please provide a valid category ID',
        'any.required': 'Category ID is required'
      }),
    unit_of_measure_id: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.guid': 'Please provide a valid unit of measure ID',
        'any.required': 'Unit of measure ID is required'
      }),
    purchase_price: Joi.number()
      .positive()
      .precision(2)
      .required()
      .messages({
        'number.positive': 'Purchase price must be positive',
        'any.required': 'Purchase price is required'
      }),
    selling_price: Joi.number()
      .positive()
      .precision(2)
      .required()
      .messages({
        'number.positive': 'Selling price must be positive',
        'any.required': 'Selling price is required'
      }),
    min_stock_level: Joi.number()
      .min(0)
      .required()
      .messages({
        'number.min': 'Minimum stock level must be 0 or greater',
        'any.required': 'Minimum stock level is required'
      }),
    max_stock_level: Joi.number()
      .min(0)
      .required()
      .messages({
        'number.min': 'Maximum stock level must be 0 or greater',
        'any.required': 'Maximum stock level is required'
      }),
    branch_id: Joi.string()
      .uuid()
      .optional()
      .messages({
        'string.guid': 'Please provide a valid branch ID'
      })
  }),

  update: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .optional(),
    description: Joi.string()
      .max(500)
      .optional(),
    sku: Joi.string()
      .min(3)
      .max(50)
      .optional(),
    barcode: Joi.string()
      .min(8)
      .max(20)
      .optional(),
    category_id: Joi.string()
      .uuid()
      .optional(),
    unit_of_measure_id: Joi.string()
      .uuid()
      .optional(),
    purchase_price: Joi.number()
      .positive()
      .precision(2)
      .optional(),
    selling_price: Joi.number()
      .positive()
      .precision(2)
      .optional(),
    min_stock_level: Joi.number()
      .min(0)
      .optional(),
    max_stock_level: Joi.number()
      .min(0)
      .optional(),
    is_active: Joi.boolean()
      .optional()
  }),

  variant: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Variant name must be at least 2 characters long',
        'string.max': 'Variant name must not exceed 100 characters',
        'any.required': 'Variant name is required'
      }),
    sku: Joi.string()
      .min(3)
      .max(50)
      .required()
      .messages({
        'string.min': 'Variant SKU must be at least 3 characters long',
        'string.max': 'Variant SKU must not exceed 50 characters',
        'any.required': 'Variant SKU is required'
      }),
    barcode: Joi.string()
      .min(8)
      .max(20)
      .optional(),
    price_modifier: Joi.number()
      .precision(2)
      .required()
      .messages({
        'any.required': 'Price modifier is required'
      })
  })
};
```

## Step 5: Testing CRUD Operations

### 5.1 Test Product Creation
```bash
curl -X POST http://localhost:3001/v1/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "description": "A test product",
    "sku": "TEST-001",
    "barcode": "1234567890123",
    "category_id": "category-uuid",
    "unit_of_measure_id": "unit-uuid",
    "purchase_price": 10.00,
    "selling_price": 15.00,
    "min_stock_level": 5,
    "max_stock_level": 100
  }'
```

### 5.2 Test Product Retrieval
```bash
# Get all products with pagination
curl -X GET "http://localhost:3001/v1/products?page=1&limit=10&search=test" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get product by ID
curl -X GET http://localhost:3001/v1/products/product-uuid \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5.3 Test Product Update
```bash
curl -X PUT http://localhost:3001/v1/products/product-uuid \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Product Name",
    "selling_price": 20.00
  }'
```

### 5.4 Test Product Search
```bash
curl -X GET "http://localhost:3001/v1/products/search?q=test&branch_id=branch-uuid" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Step 6: Bulk Operations

### 6.1 Create Bulk Operations Service
**File: `src/services/bulk-operations.service.ts`**
```typescript
import { supabaseAdmin } from '../config/supabaseClient';
import { BulkOperationResult } from '../types/crud';

export class BulkOperationsService {
  static async bulkCreate<T>(
    tableName: string, 
    items: Partial<T>[], 
    validateItem?: (item: Partial<T>) => { isValid: boolean; errors: string[] }
  ): Promise<BulkOperationResult> {
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{ index: number; error: string }>
    };

    for (let i = 0; i < items.length; i++) {
      try {
        // Validate item if validator provided
        if (validateItem) {
          const validation = validateItem(items[i]);
          if (!validation.isValid) {
            results.failed++;
            results.errors.push({
              index: i,
              error: validation.errors.join(', ')
            });
            continue;
          }
        }

        const { error } = await supabaseAdmin
          .from(tableName)
          .insert(items[i]);

        if (error) {
          results.failed++;
          results.errors.push({
            index: i,
            error: error.message
          });
        } else {
          results.successful++;
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          index: i,
          error: error.message
        });
      }
    }

    return {
      success: results.failed === 0,
      message: `Bulk operation completed. ${results.successful} successful, ${results.failed} failed.`,
      data: results
    };
  }

  static async bulkUpdate<T>(
    tableName: string,
    updates: Array<{ id: string; data: Partial<T> }>
  ): Promise<BulkOperationResult> {
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{ index: number; error: string }>
    };

    for (let i = 0; i < updates.length; i++) {
      try {
        const { error } = await supabaseAdmin
          .from(tableName)
          .update(updates[i].data)
          .eq('id', updates[i].id);

        if (error) {
          results.failed++;
          results.errors.push({
            index: i,
            error: error.message
          });
        } else {
          results.successful++;
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          index: i,
          error: error.message
        });
      }
    }

    return {
      success: results.failed === 0,
      message: `Bulk update completed. ${results.successful} successful, ${results.failed} failed.`,
      data: results
    };
  }

  static async bulkDelete(tableName: string, ids: string[]): Promise<BulkOperationResult> {
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{ index: number; error: string }>
    };

    for (let i = 0; i < ids.length; i++) {
      try {
        const { error } = await supabaseAdmin
          .from(tableName)
          .delete()
          .eq('id', ids[i]);

        if (error) {
          results.failed++;
          results.errors.push({
            index: i,
            error: error.message
          });
        } else {
          results.successful++;
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          index: i,
          error: error.message
        });
      }
    }

    return {
      success: results.failed === 0,
      message: `Bulk delete completed. ${results.successful} successful, ${results.failed} failed.`,
      data: results
    };
  }
}
```

## Next Steps
✅ **You've completed the CRUD modules implementation!**

**What's next?**
- Move to `05_testing_and_linting.md` to set up testing and linting
- Or implement more specific CRUD modules for your business logic

**Current Status:**
- ✅ Base CRUD service with common operations
- ✅ Example Products CRUD implementation
- ✅ Pagination and filtering support
- ✅ Validation schemas
- ✅ Bulk operations support
- ✅ Search functionality
- ✅ Soft delete and restore operations

**Testing Checklist:**
- [ ] Create, read, update, delete operations work
- [ ] Pagination and filtering work correctly
- [ ] Validation errors are handled properly
- [ ] Search functionality works
- [ ] Bulk operations work
- [ ] Soft delete and restore work
- [ ] Permission-based access control works
