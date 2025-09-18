# Inventory Management Backend Integration Guide

## Overview
Complete backend implementation for InventoryManagement.tsx supporting product catalog management, inventory tracking, stock movements, and analytics with robust transaction handling and multi-branch support.

## Table of Contents
1. [Database Schema](#database-schema)
2. [Express Routes](#express-routes)
3. [Controllers](#controllers)
4. [Services](#services)
5. [Frontend Integration](#frontend-integration)
6. [Implementation Plan](#implementation-plan)

---

## Database Schema

### Migration SQL

```sql
-- Products Table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(100) UNIQUE NOT NULL,
  barcode VARCHAR(50) UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit VARCHAR(50) NOT NULL DEFAULT 'pcs',
  weight DECIMAL(8,3),
  dimensions JSONB, -- {length, width, height}
  attributes JSONB DEFAULT '{}', -- product variants, colors, sizes
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories Table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suppliers Table
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  payment_terms VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product-Supplier Junction Table
CREATE TABLE product_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  supplier_sku VARCHAR(100),
  supplier_price NUMERIC(10,2),
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, supplier_id)
);

-- Inventory Levels Table
CREATE TABLE inventory_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  reorder_point INTEGER NOT NULL DEFAULT 0,
  max_stock INTEGER,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, branch_id)
);

-- Inventory Movements Table
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  movement_type VARCHAR(50) NOT NULL, -- 'in', 'out', 'adjustment', 'transfer_in', 'transfer_out', 'return'
  quantity INTEGER NOT NULL,
  before_quantity INTEGER NOT NULL,
  after_quantity INTEGER NOT NULL,
  reference VARCHAR(255), -- PO number, SO number, adjustment reason
  reason TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_inventory_levels_product_branch ON inventory_levels(product_id, branch_id);
CREATE INDEX idx_inventory_levels_branch ON inventory_levels(branch_id);
CREATE INDEX idx_inventory_movements_product ON inventory_movements(product_id);
CREATE INDEX idx_inventory_movements_branch ON inventory_movements(branch_id);
CREATE INDEX idx_inventory_movements_type ON inventory_movements(movement_type);
CREATE INDEX idx_inventory_movements_created_at ON inventory_movements(created_at);

-- Materialized View for Inventory Value
CREATE MATERIALIZED VIEW inventory_value_by_branch AS
SELECT 
  il.branch_id,
  b.name as branch_name,
  COUNT(DISTINCT il.product_id) as product_count,
  SUM(il.quantity * p.cost) as total_cost_value,
  SUM(il.quantity * p.price) as total_selling_value,
  SUM(CASE WHEN il.quantity <= il.reorder_point THEN 1 ELSE 0 END) as low_stock_count,
  SUM(CASE WHEN il.quantity = 0 THEN 1 ELSE 0 END) as out_of_stock_count
FROM inventory_levels il
JOIN products p ON il.product_id = p.id
JOIN branches b ON il.branch_id = b.id
WHERE p.is_active = TRUE
GROUP BY il.branch_id, b.name;

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_inventory_value()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW inventory_value_by_branch;
END;
$$ LANGUAGE plpgsql;

-- Stock Adjustment Function
CREATE OR REPLACE FUNCTION adjust_inventory_stock(
  p_product_id UUID,
  p_branch_id UUID,
  p_quantity INTEGER,
  p_adjustment_type VARCHAR(20),
  p_reason TEXT,
  p_reference VARCHAR(255),
  p_created_by UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  new_quantity INTEGER
) AS $$
DECLARE
  current_qty INTEGER;
  new_qty INTEGER;
  movement_id UUID;
BEGIN
  -- Get current quantity
  SELECT quantity INTO current_qty
  FROM inventory_levels
  WHERE product_id = p_product_id AND branch_id = p_branch_id;
  
  -- Calculate new quantity
  CASE p_adjustment_type
    WHEN 'add' THEN new_qty := current_qty + p_quantity;
    WHEN 'remove' THEN new_qty := current_qty - p_quantity;
    WHEN 'set' THEN new_qty := p_quantity;
    ELSE
      RETURN QUERY SELECT FALSE, 'Invalid adjustment type', current_qty;
      RETURN;
  END CASE;
  
  -- Check for negative stock
  IF new_qty < 0 THEN
    RETURN QUERY SELECT FALSE, 'Insufficient stock', current_qty;
    RETURN;
  END IF;
  
  -- Update inventory level
  INSERT INTO inventory_levels (product_id, branch_id, quantity, last_updated)
  VALUES (p_product_id, p_branch_id, new_qty, NOW())
  ON CONFLICT (product_id, branch_id)
  DO UPDATE SET 
    quantity = new_qty,
    last_updated = NOW(),
    updated_at = NOW();
  
  -- Record movement
  INSERT INTO inventory_movements (
    product_id, branch_id, movement_type, quantity,
    before_quantity, after_quantity, reason, reference, created_by
  ) VALUES (
    p_product_id, p_branch_id, 'adjustment', p_quantity,
    current_qty, new_qty, p_reason, p_reference, p_created_by
  ) RETURNING id INTO movement_id;
  
  RETURN QUERY SELECT TRUE, 'Stock adjusted successfully', new_qty;
END;
$$ LANGUAGE plpgsql;
```

---

## Express Routes

### Route File: `backend/src/routes/inventory.routes.ts`

```typescript
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRoles, hasPermission } from '../middleware/rbac';
import { asyncHandler } from '../middleware/errorHandler';
import * as inventoryController from '../controllers/inventory.controller';

const router = Router();
router.use(requireAuth);

// Product Management
router.get('/inventory/products', 
  requireRoles(['super_admin', 'inventory_admin', 'inventory_staff']),
  hasPermission('inventory.products.read'),
  asyncHandler(inventoryController.getProducts)
);

router.get('/inventory/products/:id', 
  requireRoles(['super_admin', 'inventory_admin', 'inventory_staff']),
  hasPermission('inventory.products.read'),
  asyncHandler(inventoryController.getProduct)
);

router.post('/inventory/products', 
  requireRoles(['super_admin', 'inventory_admin']),
  hasPermission('inventory.products.create'),
  asyncHandler(inventoryController.createProduct)
);

router.put('/inventory/products/:id', 
  requireRoles(['super_admin', 'inventory_admin']),
  hasPermission('inventory.products.update'),
  asyncHandler(inventoryController.updateProduct)
);

router.delete('/inventory/products/:id', 
  requireRoles(['super_admin', 'inventory_admin']),
  hasPermission('inventory.products.delete'),
  asyncHandler(inventoryController.deleteProduct)
);

// Inventory Operations
router.get('/inventory/stock-levels', 
  requireRoles(['super_admin', 'inventory_admin', 'inventory_staff']),
  hasPermission('inventory.stock.read'),
  asyncHandler(inventoryController.getStockLevels)
);

router.post('/inventory/stock-adjustments', 
  requireRoles(['super_admin', 'inventory_admin', 'inventory_staff']),
  hasPermission('inventory.stock.update'),
  asyncHandler(inventoryController.adjustStock)
);

router.post('/inventory/transfer', 
  requireRoles(['super_admin', 'inventory_admin', 'inventory_staff']),
  hasPermission('inventory.stock.transfer'),
  asyncHandler(inventoryController.transferStock)
);

router.get('/inventory/movements', 
  requireRoles(['super_admin', 'inventory_admin', 'inventory_staff']),
  hasPermission('inventory.movements.read'),
  asyncHandler(inventoryController.getMovements)
);

// Categories & Suppliers
router.get('/inventory/categories', 
  requireRoles(['super_admin', 'inventory_admin']),
  hasPermission('inventory.categories.read'),
  asyncHandler(inventoryController.getCategories)
);

router.post('/inventory/categories', 
  requireRoles(['super_admin', 'inventory_admin']),
  hasPermission('inventory.categories.create'),
  asyncHandler(inventoryController.createCategory)
);

router.get('/inventory/suppliers', 
  requireRoles(['super_admin', 'inventory_admin']),
  hasPermission('inventory.suppliers.read'),
  asyncHandler(inventoryController.getSuppliers)
);

router.post('/inventory/suppliers', 
  requireRoles(['super_admin', 'inventory_admin']),
  hasPermission('inventory.suppliers.create'),
  asyncHandler(inventoryController.createSupplier)
);

// Analytics & Dashboard
router.get('/inventory/dashboard', 
  requireRoles(['super_admin', 'inventory_admin']),
  hasPermission('inventory.analytics.read'),
  asyncHandler(inventoryController.getDashboard)
);

router.get('/inventory/analytics/stock-status', 
  requireRoles(['super_admin', 'inventory_admin']),
  hasPermission('inventory.analytics.read'),
  asyncHandler(inventoryController.getStockStatus)
);

router.get('/inventory/analytics/value', 
  requireRoles(['super_admin', 'inventory_admin']),
  hasPermission('inventory.analytics.read'),
  asyncHandler(inventoryController.getInventoryValue)
);

router.get('/inventory/analytics/low-stock', 
  requireRoles(['super_admin', 'inventory_admin']),
  hasPermission('inventory.analytics.read'),
  asyncHandler(inventoryController.getLowStock)
);

// Bulk Operations
router.post('/inventory/products/bulk-upload', 
  requireRoles(['super_admin', 'inventory_admin']),
  hasPermission('inventory.products.create'),
  asyncHandler(inventoryController.bulkUploadProducts)
);

router.post('/inventory/stock-adjustments/bulk', 
  requireRoles(['super_admin', 'inventory_admin']),
  hasPermission('inventory.stock.update'),
  asyncHandler(inventoryController.bulkAdjustStock)
);

// Reports
router.get('/inventory/reports/stock-summary', 
  requireRoles(['super_admin', 'inventory_admin']),
  hasPermission('inventory.reports.read'),
  asyncHandler(inventoryController.getStockSummaryReport)
);

export default router;
```

---

## Controllers

### Controller: `backend/src/controllers/inventory.controller.ts`

```typescript
import { Request, Response } from 'express';
import { InventoryService } from '../services/inventory.service';
import { validateProductInput, validateStockAdjustment } from '../validators/inventory.validator';

export const getProducts = async (req: Request, res: Response) => {
  const { 
    search, 
    sku, 
    category_id, 
    supplier_id, 
    is_active, 
    low_stock, 
    page = 1, 
    limit = 20,
    sort_by = 'name',
    sort_order = 'asc'
  } = req.query;

  const filters = {
    search: search as string,
    sku: sku as string,
    category_id: category_id as string,
    supplier_id: supplier_id as string,
    is_active: is_active as string,
    low_stock: low_stock === 'true',
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    sort_by: sort_by as string,
    sort_order: sort_order as string
  };

  const result = await InventoryService.getProducts(filters);
  
  res.json({
    success: true,
    data: result.products,
    pagination: result.pagination
  });
};

export const getProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const product = await InventoryService.getProductById(id);
  
  res.json({
    success: true,
    data: product
  });
};

export const createProduct = async (req: Request, res: Response) => {
  const validationResult = validateProductInput(req.body);
  
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      errors: validationResult.errors
    });
  }

  const userId = req.user.id;
  const product = await InventoryService.createProduct(req.body, userId);
  
  res.status(201).json({
    success: true,
    data: product
  });
};

export const adjustStock = async (req: Request, res: Response) => {
  const validationResult = validateStockAdjustment(req.body);
  
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      errors: validationResult.errors
    });
  }

  const userId = req.user.id;
  const result = await InventoryService.adjustStock(req.body, userId);
  
  res.json({
    success: true,
    data: result
  });
};

export const transferStock = async (req: Request, res: Response) => {
  const { product_id, from_branch_id, to_branch_id, quantity, reference } = req.body;
  const userId = req.user.id;
  
  const result = await InventoryService.transferStock({
    product_id,
    from_branch_id,
    to_branch_id,
    quantity,
    reference
  }, userId);
  
  res.json({
    success: true,
    data: result
  });
};

export const getDashboard = async (req: Request, res: Response) => {
  const { branch_id } = req.query;
  
  const dashboard = await InventoryService.getDashboard({
    branch_id: branch_id as string
  });
  
  res.json({
    success: true,
    data: dashboard
  });
};

export const getStockStatus = async (req: Request, res: Response) => {
  const { branch_id } = req.query;
  
  const status = await InventoryService.getStockStatus({
    branch_id: branch_id as string
  });
  
  res.json({
    success: true,
    data: status
  });
};

export const getInventoryValue = async (req: Request, res: Response) => {
  const { branch_id, category_id } = req.query;
  
  const value = await InventoryService.getInventoryValue({
    branch_id: branch_id as string,
    category_id: category_id as string
  });
  
  res.json({
    success: true,
    data: value
  });
};

export const getLowStock = async (req: Request, res: Response) => {
  const { threshold = 10, category_id, branch_id } = req.query;
  
  const lowStock = await InventoryService.getLowStock({
    threshold: parseInt(threshold as string),
    category_id: category_id as string,
    branch_id: branch_id as string
  });
  
  res.json({
    success: true,
    data: lowStock
  });
};

export const bulkUploadProducts = async (req: Request, res: Response) => {
  const userId = req.user.id;
  
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }
  
  const result = await InventoryService.bulkUploadProducts(req.file, userId);
  
  res.json({
    success: true,
    data: result
  });
};

export const getStockSummaryReport = async (req: Request, res: Response) => {
  const { format = 'csv', branch_id } = req.query;
  
  const report = await InventoryService.generateStockSummaryReport({
    format: format as string,
    branch_id: branch_id as string
  });
  
  res.json({
    success: true,
    data: report
  });
};
```

---

## Services

### Service: `backend/src/services/inventory.service.ts`

```typescript
import { supabase } from '../config/supabase';
import { ExportService } from './exports.service';
import * as XLSX from 'xlsx';

export class InventoryService {
  static async getProducts(filters: any) {
    let query = supabase
      .from('products')
      .select(`
        *,
        category:category_id (
          id,
          name
        ),
        product_suppliers (
          supplier_id,
          suppliers (
            id,
            name
          )
        ),
        inventory_levels (
          branch_id,
          quantity,
          reorder_point,
          reserved_quantity
        )
      `);

    // Apply filters
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
    }
    if (filters.sku) {
      query = query.eq('sku', filters.sku);
    }
    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }
    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active === 'true');
    }

    // Apply sorting
    const sortOrder = filters.sort_order === 'desc' ? { ascending: false } : { ascending: true };
    query = query.order(filters.sort_by, sortOrder);

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: products, error, count } = await query
      .range(from, to);

    if (error) throw error;

    // Filter low stock if requested
    let filteredProducts = products || [];
    if (filters.low_stock) {
      filteredProducts = filteredProducts.filter(product => 
        product.inventory_levels?.some(level => 
          level.quantity <= level.reorder_point
        )
      );
    }

    return {
      products: filteredProducts,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    };
  }

  static async getProductById(id: string) {
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        category:category_id (
          id,
          name
        ),
        product_suppliers (
          supplier_id,
          supplier_sku,
          supplier_price,
          is_primary,
          suppliers (
            id,
            name,
            contact_person
          )
        ),
        inventory_levels (
          branch_id,
          quantity,
          reorder_point,
          reserved_quantity,
          branches (
            id,
            name
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return product;
  }

  static async createProduct(productData: any, userId: string) {
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        ...productData,
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;

    // Create inventory levels for all branches
    const { data: branches } = await supabase
      .from('branches')
      .select('id');

    if (branches) {
      const inventoryLevels = branches.map(branch => ({
        product_id: product.id,
        branch_id: branch.id,
        quantity: 0,
        reorder_point: productData.reorder_point || 0
      }));

      await supabase
        .from('inventory_levels')
        .insert(inventoryLevels);
    }

    return product;
  }

  static async adjustStock(adjustmentData: any, userId: string) {
    const { data, error } = await supabase.rpc('adjust_inventory_stock', {
      p_product_id: adjustmentData.product_id,
      p_branch_id: adjustmentData.branch_id,
      p_quantity: adjustmentData.quantity,
      p_adjustment_type: adjustmentData.adjustment_type,
      p_reason: adjustmentData.reason,
      p_reference: adjustmentData.reference,
      p_created_by: userId
    });

    if (error) throw error;

    const result = data[0];
    if (!result.success) {
      throw new Error(result.message);
    }

    return {
      success: result.success,
      message: result.message,
      new_quantity: result.new_quantity
    };
  }

  static async transferStock(transferData: any, userId: string) {
    const { product_id, from_branch_id, to_branch_id, quantity, reference } = transferData;

    // Check if source branch has enough stock
    const { data: sourceLevel, error: sourceError } = await supabase
      .from('inventory_levels')
      .select('quantity')
      .eq('product_id', product_id)
      .eq('branch_id', from_branch_id)
      .single();

    if (sourceError) throw sourceError;
    if (sourceLevel.quantity < quantity) {
      throw new Error('Insufficient stock for transfer');
    }

    // Perform transfer using transactions
    const { data, error } = await supabase.rpc('transfer_inventory_stock', {
      p_product_id: product_id,
      p_from_branch_id: from_branch_id,
      p_to_branch_id: to_branch_id,
      p_quantity: quantity,
      p_reference: reference,
      p_created_by: userId
    });

    if (error) throw error;

    return data[0];
  }

  static async getDashboard(filters: any) {
    const { data, error } = await supabase
      .from('inventory_value_by_branch')
      .select('*');

    if (error) throw error;

    const totalProducts = await supabase
      .from('products')
      .select('id', { count: 'exact' })
      .eq('is_active', true);

    const totalValue = data?.reduce((sum, branch) => sum + parseFloat(branch.total_cost_value), 0) || 0;
    const lowStockCount = data?.reduce((sum, branch) => sum + branch.low_stock_count, 0) || 0;
    const outOfStockCount = data?.reduce((sum, branch) => sum + branch.out_of_stock_count, 0) || 0;

    return {
      total_products: totalProducts.count || 0,
      total_inventory_value: totalValue,
      low_stock_count: lowStockCount,
      out_of_stock_count: outOfStockCount,
      branch_breakdown: data || []
    };
  }

  static async getStockStatus(filters: any) {
    const { data, error } = await supabase
      .from('inventory_levels')
      .select(`
        quantity,
        reorder_point,
        products (
          id,
          name,
          sku
        ),
        branches (
          id,
          name
        )
      `);

    if (error) throw error;

    const status = {
      good: 0,
      low: 0,
      out_of_stock: 0,
      breakdown: data?.map(level => ({
        product_id: level.products.id,
        product_name: level.products.name,
        sku: level.products.sku,
        branch_name: level.branches.name,
        quantity: level.quantity,
        status: level.quantity === 0 ? 'out_of_stock' : 
                level.quantity <= level.reorder_point ? 'low' : 'good'
      })) || []
    };

    status.good = status.breakdown.filter(item => item.status === 'good').length;
    status.low = status.breakdown.filter(item => item.status === 'low').length;
    status.out_of_stock = status.breakdown.filter(item => item.status === 'out_of_stock').length;

    return status;
  }

  static async getInventoryValue(filters: any) {
    let query = supabase
      .from('inventory_levels')
      .select(`
        quantity,
        products (
          cost,
          price,
          category_id,
          categories (
            name
          )
        ),
        branches (
          id,
          name
        )
      `);

    if (filters.branch_id) {
      query = query.eq('branch_id', filters.branch_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    const value = data?.reduce((acc, level) => {
      const costValue = level.quantity * level.products.cost;
      const sellingValue = level.quantity * level.products.price;
      
      if (!acc.total_cost) acc.total_cost = 0;
      if (!acc.total_selling) acc.total_selling = 0;
      
      acc.total_cost += costValue;
      acc.total_selling += sellingValue;
      
      return acc;
    }, { total_cost: 0, total_selling: 0 }) || { total_cost: 0, total_selling: 0 };

    return value;
  }

  static async getLowStock(filters: any) {
    let query = supabase
      .from('inventory_levels')
      .select(`
        quantity,
        reorder_point,
        products (
          id,
          name,
          sku,
          cost,
          price
        ),
        branches (
          id,
          name
        )
      `)
      .lte('quantity', filters.threshold);

    if (filters.branch_id) {
      query = query.eq('branch_id', filters.branch_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data?.map(level => ({
      product_id: level.products.id,
      product_name: level.products.name,
      sku: level.products.sku,
      branch_name: level.branches.name,
      current_quantity: level.quantity,
      reorder_point: level.reorder_point,
      cost_value: level.quantity * level.products.cost,
      selling_value: level.quantity * level.products.price
    })) || [];
  }

  static async bulkUploadProducts(file: Express.Multer.File, userId: string) {
    const workbook = XLSX.read(file.buffer);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const results = {
      total: data.length,
      success: 0,
      errors: []
    };

    for (const [index, row] of data.entries()) {
      try {
        await this.createProduct({
          sku: row.sku,
          name: row.name,
          description: row.description,
          category_id: row.category_id,
          price: row.price,
          cost: row.cost,
          unit: row.unit || 'pcs',
          reorder_point: row.reorder_point || 0
        }, userId);
        results.success++;
      } catch (error) {
        results.errors.push({
          row: index + 1,
          error: error.message
        });
      }
    }

    return results;
  }

  static async generateStockSummaryReport(options: any) {
    const { data, error } = await supabase
      .from('inventory_levels')
      .select(`
        quantity,
        reorder_point,
        products (
          sku,
          name,
          cost,
          price
        ),
        branches (
          name
        )
      `);

    if (error) throw error;

    const reportData = data?.map(level => ({
      sku: level.products.sku,
      name: level.products.name,
      branch: level.branches.name,
      quantity: level.quantity,
      reorder_point: level.reorder_point,
      cost_value: level.quantity * level.products.cost,
      selling_value: level.quantity * level.products.price
    })) || [];

    return await ExportService.createExport({
      export_name: `stock_summary_${new Date().toISOString()}`,
      export_type: 'inventory',
      format: options.format,
      data: reportData
    }, options.user_id);
  }
}
```

---

## Frontend Integration

### API Service: `frontend/src/services/inventoryService.ts`

```typescript
import { apiClient } from './apiClient';

export class InventoryService {
  static async getProducts(filters: any = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/api/v1/inventory/products?${params.toString()}`);
    return response.data;
  }

  static async getProduct(id: string) {
    const response = await apiClient.get(`/api/v1/inventory/products/${id}`);
    return response.data;
  }

  static async createProduct(productData: any) {
    const response = await apiClient.post('/api/v1/inventory/products', productData);
    return response.data;
  }

  static async updateProduct(id: string, productData: any) {
    const response = await apiClient.put(`/api/v1/inventory/products/${id}`, productData);
    return response.data;
  }

  static async deleteProduct(id: string) {
    const response = await apiClient.delete(`/api/v1/inventory/products/${id}`);
    return response.data;
  }

  static async getStockLevels(filters: any = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/api/v1/inventory/stock-levels?${params.toString()}`);
    return response.data;
  }

  static async adjustStock(adjustmentData: any) {
    const response = await apiClient.post('/api/v1/inventory/stock-adjustments', adjustmentData);
    return response.data;
  }

  static async transferStock(transferData: any) {
    const response = await apiClient.post('/api/v1/inventory/transfer', transferData);
    return response.data;
  }

  static async getDashboard(branchId?: string) {
    const params = new URLSearchParams();
    if (branchId) params.append('branch_id', branchId);

    const response = await apiClient.get(`/api/v1/inventory/dashboard?${params.toString()}`);
    return response.data;
  }

  static async getStockStatus(branchId?: string) {
    const params = new URLSearchParams();
    if (branchId) params.append('branch_id', branchId);

    const response = await apiClient.get(`/api/v1/inventory/analytics/stock-status?${params.toString()}`);
    return response.data;
  }

  static async getLowStock(threshold = 10, categoryId?: string, branchId?: string) {
    const params = new URLSearchParams();
    params.append('threshold', threshold.toString());
    if (categoryId) params.append('category_id', categoryId);
    if (branchId) params.append('branch_id', branchId);

    const response = await apiClient.get(`/api/v1/inventory/analytics/low-stock?${params.toString()}`);
    return response.data;
  }

  static async bulkUploadProducts(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/api/v1/inventory/products/bulk-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  static async generateStockSummaryReport(format = 'csv', branchId?: string) {
    const params = new URLSearchParams();
    params.append('format', format);
    if (branchId) params.append('branch_id', branchId);

    const response = await apiClient.get(`/api/v1/inventory/reports/stock-summary?${params.toString()}`);
    return response.data;
  }
}
```

---

## Implementation Plan

### Step 1: Database Setup
**Files to create:**
- `backend/supabase/migrations/001_create_inventory_tables.sql`
- `backend/supabase/migrations/002_create_inventory_functions.sql`

**Tasks:**
1. Create all inventory-related tables
2. Add performance indexes
3. Create inventory functions
4. Set up materialized views
5. Test all database functions

### Step 2: Backend Services
**Files to create:**
- `backend/src/services/inventory.service.ts`
- `backend/src/controllers/inventory.controller.ts`
- `backend/src/routes/inventory.routes.ts`
- `backend/src/validators/inventory.validator.ts`

**Tasks:**
1. Implement InventoryService with all CRUD operations
2. Add stock adjustment and transfer logic
3. Create analytics and reporting functions
4. Add bulk upload functionality
5. Implement audit logging

### Step 3: Frontend Integration
**Files to create:**
- `frontend/src/services/inventoryService.ts`
- `frontend/src/hooks/useInventory.ts`
- `frontend/src/types/inventory.ts`

**Tasks:**
1. Create API service layer
2. Implement React hooks for state management
3. Add bulk operations support
4. Test all inventory endpoints
5. Implement real-time updates

### Acceptance Criteria
- Product CRUD operations work correctly
- Stock adjustments maintain data consistency
- Transfer operations work atomically
- Analytics provide accurate metrics
- Bulk upload handles errors gracefully
- Export functionality generates reports
- RBAC prevents unauthorized access

This implementation provides a comprehensive inventory management system with robust transaction handling, multi-branch support, and advanced analytics capabilities.
