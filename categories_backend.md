# Categories Backend Integration Guide

## Overview
Complete backend implementation for Categories.tsx supporting hierarchical category management, statistics aggregation, bulk operations, and export capabilities. This module handles product categories with parent-child relationships, performance metrics, and comprehensive CRUD operations.

## Table of Contents
1. [Database Schema & Migrations](#database-schema--migrations)
2. [Express Routes & Controllers](#express-routes--controllers)
3. [Services & Data Layer](#services--data-layer)
4. [Statistics & Analytics](#statistics--analytics)
5. [Frontend Integration](#frontend-integration)
6. [Implementation Plan](#implementation-plan)

---

## Database Schema & Migrations

### Enhanced Categories Table

```sql
-- Ensure categories table has hierarchy support
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color for UI
  icon VARCHAR(100), -- Icon identifier (e.g., 'shopping-cart', 'paw-print')
  display_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}', -- Additional UI/UX settings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE NULL -- Soft delete support
);

-- Create category_stats table for performance
CREATE TABLE IF NOT EXISTS category_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  product_count INTEGER DEFAULT 0,
  total_value DECIMAL(15,2) DEFAULT 0.00,
  average_value DECIMAL(15,2) DEFAULT 0.00,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_deleted ON categories(deleted_at);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_category_stats_category ON category_stats(category_id);
CREATE INDEX IF NOT EXISTS idx_category_stats_updated ON category_stats(last_updated);

-- Add hierarchy constraint to prevent cycles
ALTER TABLE categories ADD CONSTRAINT check_no_self_parent 
CHECK (id != parent_id);
```

### Category Statistics Maintenance

```sql
-- Function to update category statistics
CREATE OR REPLACE FUNCTION update_category_stats(p_category_id UUID)
RETURNS VOID AS $$
DECLARE
  v_product_count INTEGER;
  v_total_value DECIMAL(15,2);
  v_average_value DECIMAL(15,2);
BEGIN
  -- Calculate product count and total value
  SELECT 
    COUNT(p.id),
    COALESCE(SUM(il.quantity * p.price), 0)
  INTO v_product_count, v_total_value
  FROM products p
  LEFT JOIN inventory_levels il ON p.id = il.product_id
  WHERE p.category_id = p_category_id
    AND p.is_active = true
    AND p.deleted_at IS NULL;

  -- Calculate average value
  v_average_value := CASE 
    WHEN v_product_count > 0 THEN v_total_value / v_product_count
    ELSE 0 
  END;

  -- Insert or update stats
  INSERT INTO category_stats (category_id, product_count, total_value, average_value, last_updated)
  VALUES (p_category_id, v_product_count, v_total_value, v_average_value, NOW())
  ON CONFLICT (category_id) 
  DO UPDATE SET
    product_count = EXCLUDED.product_count,
    total_value = EXCLUDED.total_value,
    average_value = EXCLUDED.average_value,
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update all category stats
CREATE OR REPLACE FUNCTION refresh_all_category_stats()
RETURNS VOID AS $$
DECLARE
  category_record RECORD;
BEGIN
  FOR category_record IN 
    SELECT id FROM categories WHERE deleted_at IS NULL
  LOOP
    PERFORM update_category_stats(category_record.id);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update stats when products change
CREATE OR REPLACE FUNCTION trigger_update_category_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update stats for the affected category
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM update_category_stats(NEW.category_id);
  END IF;
  
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    PERFORM update_category_stats(OLD.category_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger on products table
DROP TRIGGER IF EXISTS products_category_stats_trigger ON products;
CREATE TRIGGER products_category_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_category_stats();
```

### Hierarchy Queries

```sql
-- Function to get category tree (recursive CTE)
CREATE OR REPLACE FUNCTION get_category_tree(p_root_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  description TEXT,
  parent_id UUID,
  level INTEGER,
  path TEXT,
  is_active BOOLEAN,
  color VARCHAR(7),
  icon VARCHAR(100),
  display_order INTEGER,
  product_count INTEGER,
  total_value DECIMAL(15,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE category_tree AS (
    -- Base case: root categories
    SELECT 
      c.id,
      c.name,
      c.description,
      c.parent_id,
      0 as level,
      c.name as path,
      c.is_active,
      c.color,
      c.icon,
      c.display_order,
      COALESCE(cs.product_count, 0) as product_count,
      COALESCE(cs.total_value, 0) as total_value
    FROM categories c
    LEFT JOIN category_stats cs ON c.id = cs.category_id
    WHERE (p_root_id IS NULL AND c.parent_id IS NULL) 
       OR (p_root_id IS NOT NULL AND c.id = p_root_id)
      AND c.deleted_at IS NULL
    
    UNION ALL
    
    -- Recursive case: children
    SELECT 
      c.id,
      c.name,
      c.description,
      c.parent_id,
      ct.level + 1,
      ct.path || ' > ' || c.name,
      c.is_active,
      c.color,
      c.icon,
      c.display_order,
      COALESCE(cs.product_count, 0) as product_count,
      COALESCE(cs.total_value, 0) as total_value
    FROM categories c
    JOIN category_tree ct ON c.parent_id = ct.id
    LEFT JOIN category_stats cs ON c.id = cs.category_id
    WHERE c.deleted_at IS NULL
  )
  SELECT * FROM category_tree ORDER BY level, display_order, name;
END;
$$ LANGUAGE plpgsql;

-- Function to check for cycles when moving categories
CREATE OR REPLACE FUNCTION check_category_cycle(p_category_id UUID, p_new_parent_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_parent UUID;
BEGIN
  -- If setting parent to NULL, no cycle possible
  IF p_new_parent_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- If setting parent to self, cycle detected
  IF p_category_id = p_new_parent_id THEN
    RETURN TRUE;
  END IF;
  
  -- Check if new parent is a descendant of the category
  current_parent := p_new_parent_id;
  WHILE current_parent IS NOT NULL LOOP
    IF current_parent = p_category_id THEN
      RETURN TRUE; -- Cycle detected
    END IF;
    
    SELECT parent_id INTO current_parent 
    FROM categories 
    WHERE id = current_parent AND deleted_at IS NULL;
  END LOOP;
  
  RETURN FALSE; -- No cycle
END;
$$ LANGUAGE plpgsql;
```

---

## Express Routes & Controllers

### Route File: `backend/src/routes/categories.routes.ts`

```typescript
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRoles, hasPermission } from '../middleware/rbac';
import { asyncHandler } from '../middleware/errorHandler';
import * as categoryController from '../controllers/categories.controller';

const router = Router();

// Apply authentication to all routes
router.use(requireAuth);

// Category Management Routes
router.get('/categories', 
  requireRoles(['super_admin', 'inventory_admin', 'sales_admin']),
  hasPermission('categories.read'),
  asyncHandler(categoryController.listCategories)
);

router.get('/categories/:id', 
  requireRoles(['super_admin', 'inventory_admin', 'sales_admin']),
  hasPermission('categories.read'),
  asyncHandler(categoryController.getCategory)
);

router.post('/categories', 
  requireRoles(['super_admin', 'inventory_admin']),
  hasPermission('categories.create'),
  asyncHandler(categoryController.createCategory)
);

router.put('/categories/:id', 
  requireRoles(['super_admin', 'inventory_admin']),
  hasPermission('categories.update'),
  asyncHandler(categoryController.updateCategory)
);

router.delete('/categories/:id', 
  requireRoles(['super_admin', 'inventory_admin']),
  hasPermission('categories.delete'),
  asyncHandler(categoryController.deleteCategory)
);

// Category Statistics
router.get('/categories/stats', 
  requireRoles(['super_admin', 'inventory_admin', 'sales_admin']),
  hasPermission('categories.read'),
  asyncHandler(categoryController.getCategoryStats)
);

router.get('/categories/:id/stats', 
  requireRoles(['super_admin', 'inventory_admin', 'sales_admin']),
  hasPermission('categories.read'),
  asyncHandler(categoryController.getCategoryStatsById)
);

// Category Products
router.get('/categories/:id/products', 
  requireRoles(['super_admin', 'inventory_admin', 'sales_admin']),
  hasPermission('categories.read'),
  asyncHandler(categoryController.getCategoryProducts)
);

router.get('/categories/:id/product-count', 
  requireRoles(['super_admin', 'inventory_admin', 'sales_admin']),
  hasPermission('categories.read'),
  asyncHandler(categoryController.getCategoryProductCount)
);

router.get('/categories/:id/total-value', 
  requireRoles(['super_admin', 'inventory_admin', 'sales_admin']),
  hasPermission('categories.read'),
  asyncHandler(categoryController.getCategoryTotalValue)
);

// Hierarchy & Tree
router.get('/categories/tree', 
  requireRoles(['super_admin', 'inventory_admin', 'sales_admin']),
  hasPermission('categories.read'),
  asyncHandler(categoryController.getCategoryTree)
);

router.get('/categories/:id/children', 
  requireRoles(['super_admin', 'inventory_admin', 'sales_admin']),
  hasPermission('categories.read'),
  asyncHandler(categoryController.getCategoryChildren)
);

router.get('/categories/:id/parent', 
  requireRoles(['super_admin', 'inventory_admin', 'sales_admin']),
  hasPermission('categories.read'),
  asyncHandler(categoryController.getCategoryParent)
);

router.post('/categories/:id/move', 
  requireRoles(['super_admin', 'inventory_admin']),
  hasPermission('categories.update'),
  asyncHandler(categoryController.moveCategory)
);

// Actions & Bulk Operations
router.patch('/categories/:id/activate', 
  requireRoles(['super_admin', 'inventory_admin']),
  hasPermission('categories.update'),
  asyncHandler(categoryController.activateCategory)
);

router.patch('/categories/:id/deactivate', 
  requireRoles(['super_admin', 'inventory_admin']),
  hasPermission('categories.update'),
  asyncHandler(categoryController.deactivateCategory)
);

router.post('/categories/bulk', 
  requireRoles(['super_admin', 'inventory_admin']),
  hasPermission('categories.update'),
  asyncHandler(categoryController.bulkCategoryOperations)
);

// Export & Analytics
router.get('/categories/:id/export', 
  requireRoles(['super_admin', 'inventory_admin', 'sales_admin']),
  hasPermission('categories.export'),
  asyncHandler(categoryController.exportCategory)
);

router.get('/categories/export', 
  requireRoles(['super_admin', 'inventory_admin', 'sales_admin']),
  hasPermission('categories.export'),
  asyncHandler(categoryController.exportAllCategories)
);

router.get('/categories/analytics/top-performing', 
  requireRoles(['super_admin', 'inventory_admin', 'sales_admin']),
  hasPermission('categories.analytics'),
  asyncHandler(categoryController.getTopPerformingCategories)
);

router.get('/categories/analytics/low-performing', 
  requireRoles(['super_admin', 'inventory_admin', 'sales_admin']),
  hasPermission('categories.analytics'),
  asyncHandler(categoryController.getLowPerformingCategories)
);

export default router;
```

### Controller: `backend/src/controllers/categories.controller.ts`

```typescript
import { Request, Response } from 'express';
import { CategoryService } from '../services/categories.service';
import { validateCategoryInput } from '../validators/category.validator';
import { AuditService } from '../services/audit.service';

export const listCategories = async (req: Request, res: Response) => {
  const {
    search,
    is_active,
    parent_id,
    include_stats = 'false',
    page = 1,
    limit = 25,
    sort_by = 'display_order',
    sort_order = 'asc'
  } = req.query;

  const filters = {
    search: search as string,
    is_active: is_active as string,
    parent_id: parent_id as string,
    include_stats: include_stats === 'true',
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    sort_by: sort_by as string,
    sort_order: sort_order as 'asc' | 'desc'
  };

  const result = await CategoryService.list(filters);
  
  res.json({
    success: true,
    data: result.categories,
    pagination: result.pagination
  });
};

export const createCategory = async (req: Request, res: Response) => {
  const validationResult = validateCategoryInput(req.body);
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      errors: validationResult.errors
    });
  }

  const userId = req.user.id;
  const category = await CategoryService.create(req.body, userId);
  
  // Audit log
  await AuditService.log({
    userId,
    action: 'category_created',
    resource: 'categories',
    resourceId: category.id,
    details: { 
      category_name: category.name,
      parent_id: category.parent_id 
    }
  });

  res.status(201).json({
    success: true,
    data: category
  });
};

export const getCategoryStatsById = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const stats = await CategoryService.getCategoryStats(id);
  
  res.json({
    success: true,
    data: stats
  });
};

export const moveCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { parent_id } = req.body;
  const userId = req.user.id;

  // Validate move operation
  const canMove = await CategoryService.validateMove(id, parent_id);
  if (!canMove) {
    return res.status(400).json({
      success: false,
      message: 'Cannot move category: would create a cycle or invalid hierarchy'
    });
  }

  const result = await CategoryService.moveCategory(id, parent_id, userId);
  
  await AuditService.log({
    userId,
    action: 'category_moved',
    resource: 'categories',
    resourceId: id,
    details: { 
      new_parent_id: parent_id,
      old_parent_id: result.old_parent_id 
    }
  });

  res.json({
    success: true,
    data: result
  });
};

export const bulkCategoryOperations = async (req: Request, res: Response) => {
  const { operation, category_ids, data } = req.body;
  const userId = req.user.id;

  const result = await CategoryService.bulkOperations(operation, category_ids, data, userId);
  
  await AuditService.log({
    userId,
    action: 'categories_bulk_operation',
    resource: 'categories',
    resourceId: category_ids.join(','),
    details: { operation, count: category_ids.length }
  });

  res.json({
    success: true,
    data: result
  });
};

export const exportCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { format = 'csv' } = req.query;
  
  const exportData = await CategoryService.exportCategory(id, format as string);
  
  res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="category-${id}-export.${format}"`);
  
  res.send(exportData);
};

export const getTopPerformingCategories = async (req: Request, res: Response) => {
  const { limit = 10, period = '30' } = req.query;
  
  const categories = await CategoryService.getTopPerformingCategories(
    parseInt(limit as string),
    parseInt(period as string)
  );
  
  res.json({
    success: true,
    data: categories
  });
};
```

---

## Services & Data Layer

### Service: `backend/src/services/categories.service.ts`

```typescript
import { supabase } from '../config/supabase';

export interface CategoryFilters {
  search?: string;
  is_active?: string;
  parent_id?: string;
  include_stats?: boolean;
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface CategoryData {
  name: string;
  description?: string;
  parent_id?: string;
  is_active?: boolean;
  color?: string;
  icon?: string;
  display_order?: number;
  metadata?: any;
}

export class CategoryService {
  static async list(filters: CategoryFilters) {
    let query = supabase
      .from('categories')
      .select(`
        *,
        parent:parent_id (
          id,
          name
        ),
        children:categories!parent_id (
          id,
          name,
          is_active
        )
        ${filters.include_stats ? ',stats:category_stats(*)' : ''}
      `, { count: 'exact' })
      .is('deleted_at', null);

    // Apply filters
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active === 'true');
    }
    if (filters.parent_id !== undefined) {
      if (filters.parent_id === 'null') {
        query = query.is('parent_id', null);
      } else {
        query = query.eq('parent_id', filters.parent_id);
      }
    }

    // Apply sorting and pagination
    const sortColumn = filters.sort_by || 'display_order';
    const ascending = filters.sort_order === 'asc';
    
    const from = (filters.page - 1) * filters.limit;
    const to = from + filters.limit - 1;

    const { data: categories, error, count } = await query
      .order(sortColumn, { ascending })
      .range(from, to);

    if (error) throw error;

    return {
      categories: categories || [],
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / filters.limit)
      }
    };
  }

  static async create(data: CategoryData, userId: string) {
    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        *,
        parent:parent_id (
          id,
          name
        )
      `)
      .single();

    if (error) throw error;

    // Initialize stats for new category
    await supabase
      .from('category_stats')
      .insert({
        category_id: category.id,
        product_count: 0,
        total_value: 0,
        average_value: 0,
        last_updated: new Date().toISOString()
      });

    return category;
  }

  static async getCategoryStats(categoryId: string) {
    const { data, error } = await supabase
      .from('category_stats')
      .select('*')
      .eq('category_id', categoryId)
      .single();

    if (error) throw error;
    return data;
  }

  static async getCategoryTree(rootId?: string) {
    const { data, error } = await supabase.rpc('get_category_tree', {
      p_root_id: rootId
    });

    if (error) throw error;
    return data;
  }

  static async validateMove(categoryId: string, newParentId: string | null) {
    if (!newParentId) return true; // Moving to root is always valid

    const { data, error } = await supabase.rpc('check_category_cycle', {
      p_category_id: categoryId,
      p_new_parent_id: newParentId
    });

    if (error) throw error;
    return !data; // Return true if no cycle detected
  }

  static async moveCategory(categoryId: string, newParentId: string | null, userId: string) {
    // Get current parent for audit
    const { data: currentCategory } = await supabase
      .from('categories')
      .select('parent_id')
      .eq('id', categoryId)
      .single();

    const { data: category, error } = await supabase
      .from('categories')
      .update({
        parent_id: newParentId,
        updated_at: new Date().toISOString()
      })
      .eq('id', categoryId)
      .select()
      .single();

    if (error) throw error;

    return {
      ...category,
      old_parent_id: currentCategory?.parent_id
    };
  }

  static async bulkOperations(operation: string, categoryIds: string[], data: any, userId: string) {
    let updateData: any = { updated_at: new Date().toISOString() };

    switch (operation) {
      case 'activate':
        updateData.is_active = true;
        break;
      case 'deactivate':
        updateData.is_active = false;
        break;
      case 'move':
        updateData.parent_id = data.parent_id;
        break;
      case 'soft_delete':
        updateData.deleted_at = new Date().toISOString();
        break;
      default:
        throw new Error(`Unknown bulk operation: ${operation}`);
    }

    const { data: categories, error } = await supabase
      .from('categories')
      .update(updateData)
      .in('id', categoryIds)
      .select();

    if (error) throw error;

    return {
      operation,
      affected_count: categories.length,
      categories
    };
  }

  static async exportCategory(categoryId: string, format: string) {
    const { data: category, error } = await supabase
      .from('categories')
      .select(`
        *,
        parent:parent_id (name),
        stats:category_stats(*),
        products:products!category_id (
          id,
          name,
          price,
          is_active
        )
      `)
      .eq('id', categoryId)
      .single();

    if (error) throw error;

    if (format === 'csv') {
      return this.generateCSV([category]);
    } else {
      return this.generateExcel([category]);
    }
  }

  static async getTopPerformingCategories(limit: number, periodDays: number) {
    const { data, error } = await supabase
      .from('category_stats')
      .select(`
        *,
        category:categories!category_id (
          id,
          name,
          description,
          color,
          icon
        )
      `)
      .order('total_value', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  private static generateCSV(categories: any[]): string {
    const headers = [
      'ID', 'Name', 'Description', 'Parent', 'Active', 'Color', 'Icon',
      'Product Count', 'Total Value', 'Average Value', 'Created At'
    ];

    const rows = categories.map(cat => [
      cat.id,
      cat.name,
      cat.description || '',
      cat.parent?.name || '',
      cat.is_active ? 'Yes' : 'No',
      cat.color || '',
      cat.icon || '',
      cat.stats?.product_count || 0,
      cat.stats?.total_value || 0,
      cat.stats?.average_value || 0,
      cat.created_at
    ]);

    return [headers, ...rows].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');
  }

  private static generateExcel(categories: any[]): Buffer {
    // Implementation would use a library like 'exceljs'
    // This is a placeholder - implement based on your Excel library choice
    return Buffer.from('Excel data placeholder');
  }
}
```

### Input Validation: `backend/src/validators/category.validator.ts`

```typescript
import Joi from 'joi';

const categorySchema = Joi.object({
  name: Joi.string().required().min(1).max(255),
  description: Joi.string().max(1000).optional(),
  parent_id: Joi.string().uuid().optional().allow(null),
  is_active: Joi.boolean().optional(),
  color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
  icon: Joi.string().max(100).optional(),
  display_order: Joi.number().integer().min(0).optional(),
  metadata: Joi.object().optional()
});

export const validateCategoryInput = (data: any) => {
  const { error, value } = categorySchema.validate(data, { abortEarly: false });
  
  if (error) {
    return {
      success: false,
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    };
  }
  
  return { success: true, data: value };
};
```

---

## Frontend Integration

### API Service: `frontend/src/services/categoryService.ts`

```typescript
import { apiClient } from './apiClient';

export interface CategoryFilters {
  search?: string;
  is_active?: boolean;
  parent_id?: string | null;
  include_stats?: boolean;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface CategoryData {
  name: string;
  description?: string;
  parent_id?: string | null;
  is_active?: boolean;
  color?: string;
  icon?: string;
  display_order?: number;
  metadata?: any;
}

export class CategoryService {
  static async getCategories(filters: CategoryFilters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/v1/categories?${params.toString()}`);
    return response.data;
  }

  static async getCategory(id: string) {
    const response = await apiClient.get(`/v1/categories/${id}`);
    return response.data;
  }

  static async createCategory(data: CategoryData) {
    const response = await apiClient.post('/v1/categories', data);
    return response.data;
  }

  static async updateCategory(id: string, data: CategoryData) {
    const response = await apiClient.put(`/v1/categories/${id}`, data);
    return response.data;
  }

  static async deleteCategory(id: string) {
    const response = await apiClient.delete(`/v1/categories/${id}`);
    return response.data;
  }

  static async getCategoryStats(id: string) {
    const response = await apiClient.get(`/v1/categories/${id}/stats`);
    return response.data;
  }

  static async getCategoryTree(rootId?: string) {
    const params = rootId ? `?root_id=${rootId}` : '';
    const response = await apiClient.get(`/v1/categories/tree${params}`);
    return response.data;
  }

  static async moveCategory(id: string, parentId: string | null) {
    const response = await apiClient.post(`/v1/categories/${id}/move`, {
      parent_id: parentId
    });
    return response.data;
  }

  static async bulkOperations(operation: string, categoryIds: string[], data?: any) {
    const response = await apiClient.post('/v1/categories/bulk', {
      operation,
      category_ids: categoryIds,
      data
    });
    return response.data;
  }

  static async exportCategory(id: string, format: string = 'csv') {
    const response = await apiClient.get(`/v1/categories/${id}/export?format=${format}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  static async exportAllCategories(format: string = 'csv', includeStats: boolean = true) {
    const params = new URLSearchParams({ format, include_stats: includeStats.toString() });
    const response = await apiClient.get(`/v1/categories/export?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  static async getTopPerformingCategories(limit: number = 10, period: number = 30) {
    const response = await apiClient.get(`/v1/categories/analytics/top-performing?limit=${limit}&period=${period}`);
    return response.data;
  }
}
```

### React Hook: `frontend/src/hooks/useCategories.ts`

```typescript
import { useState, useEffect } from 'react';
import { CategoryService, CategoryFilters } from '../services/categoryService';

export const useCategories = (initialFilters: CategoryFilters = {}) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const fetchCategories = async (newFilters?: CategoryFilters) => {
    setLoading(true);
    try {
      const currentFilters = newFilters || filters;
      const result = await CategoryService.getCategories(currentFilters);
      setCategories(result.data);
      setPagination(result.pagination);
      if (newFilters) setFilters(currentFilters);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (data: any) => {
    try {
      const result = await CategoryService.createCategory(data);
      await fetchCategories(); // Refresh list
      return result;
    } catch (error) {
      console.error('Failed to create category:', error);
      throw error;
    }
  };

  const updateCategory = async (id: string, data: any) => {
    try {
      const result = await CategoryService.updateCategory(id, data);
      await fetchCategories(); // Refresh list
      return result;
    } catch (error) {
      console.error('Failed to update category:', error);
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await CategoryService.deleteCategory(id);
      await fetchCategories(); // Refresh list
    } catch (error) {
      console.error('Failed to delete category:', error);
      throw error;
    }
  };

  const moveCategory = async (id: string, parentId: string | null) => {
    try {
      await CategoryService.moveCategory(id, parentId);
      await fetchCategories(); // Refresh list
    } catch (error) {
      console.error('Failed to move category:', error);
      throw error;
    }
  };

  const bulkOperations = async (operation: string, categoryIds: string[], data?: any) => {
    try {
      const result = await CategoryService.bulkOperations(operation, categoryIds, data);
      await fetchCategories(); // Refresh list
      return result;
    } catch (error) {
      console.error('Failed to perform bulk operation:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    pagination,
    filters,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    moveCategory,
    bulkOperations,
    setFilters
  };
};
```

---

## Implementation Plan

### Step 1: Database Setup
**Files to create/modify:**
- `backend/supabase/migrations/001_create_categories_tables.sql`
- `backend/supabase/migrations/002_create_category_functions.sql`

**Tasks:**
1. Run the category table migration
2. Create category_stats table
3. Add performance indexes
4. Create hierarchy functions
5. Set up triggers for auto-updating stats

**Acceptance Criteria:**
- Categories table created with hierarchy support
- Category stats table created with proper relationships
- All indexes created successfully
- Hierarchy functions work correctly
- Triggers update stats when products change

### Step 2: Backend Services
**Files to create:**
- `backend/src/services/categories.service.ts`
- `backend/src/validators/category.validator.ts`
- `backend/src/controllers/categories.controller.ts`
- `backend/src/routes/categories.routes.ts`

**Tasks:**
1. Implement CategoryService with all CRUD operations
2. Add hierarchy management (tree, move, validate)
3. Implement statistics aggregation
4. Add bulk operations support
5. Create export functionality

**Acceptance Criteria:**
- All service methods work correctly
- Hierarchy operations prevent cycles
- Statistics are calculated accurately
- Bulk operations handle multiple categories
- Export generates proper CSV/Excel files

### Step 3: API Routes & Controllers
**Files to create:**
- `backend/src/controllers/categories.controller.ts`
- `backend/src/routes/categories.routes.ts`

**Tasks:**
1. Create all API endpoints
2. Add proper authentication and RBAC
3. Implement input validation
4. Add error handling
5. Set up audit logging

**Acceptance Criteria:**
- All endpoints return correct status codes
- Authentication and authorization work
- Input validation catches invalid data
- Error responses are consistent
- Audit logs are created for all operations

### Step 4: Frontend Integration
**Files to create:**
- `frontend/src/services/categoryService.ts`
- `frontend/src/hooks/useCategories.ts`

**Tasks:**
1. Create API service layer
2. Implement React hooks for state management
3. Add error handling and loading states
4. Test all CRUD operations
5. Implement export functionality

**Acceptance Criteria:**
- All API calls work correctly
- State management is efficient
- Error handling provides user feedback
- Export downloads work properly
- UI updates reflect backend changes

### Step 5: Testing & Validation
**Files to create:**
- `backend/src/tests/categories.service.test.ts`
- `backend/src/tests/categories.controller.test.ts`
- `frontend/src/tests/categoryService.test.ts`

**Tasks:**
1. Test all service methods
2. Test API endpoints
3. Test hierarchy operations
4. Test bulk operations
5. Test export functionality

**Acceptance Criteria:**
- All tests pass
- Edge cases are handled
- Performance is acceptable
- Security is maintained
- Documentation is complete

## Soft Delete vs Hard Delete Policy

### Recommended Approach: Soft Delete

**Benefits:**
- Preserves data integrity
- Allows recovery of accidentally deleted categories
- Maintains referential integrity with products
- Provides audit trail

**Implementation:**
```sql
-- Soft delete: Set deleted_at timestamp
UPDATE categories SET deleted_at = NOW() WHERE id = ?;

-- Hard delete: Remove from database (use with caution)
DELETE FROM categories WHERE id = ? AND deleted_at IS NOT NULL;
```

**Cascade Handling:**
- Products with deleted categories should show "Uncategorized"
- Statistics should exclude deleted categories
- Hierarchy queries should skip deleted categories
- Export should include deleted categories with flag

## Category Stats Maintenance

### Automatic Updates (Recommended)
- **Trigger-based**: Update stats when products change
- **Real-time**: Immediate updates for accuracy
- **Efficient**: Only updates affected categories

### Manual Refresh
```sql
-- Refresh all category stats
SELECT refresh_all_category_stats();

-- Refresh specific category
SELECT update_category_stats('category-uuid');
```

### Cron Job (Alternative)
```bash
# Run every hour to refresh stats
0 * * * * psql -d your_db -c "SELECT refresh_all_category_stats();"
```

This implementation provides a complete, scalable category management system with hierarchy support, statistics tracking, and comprehensive CRUD operations suitable for enterprise use.
