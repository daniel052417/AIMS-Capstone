# Inventory Summary Backend Integration Guide

## Overview
Complete backend implementation for InventorySummaryPage.tsx supporting inventory analytics, category breakdown, stock monitoring, and summary reporting with real-time updates.

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
-- Materialized View for Category Analytics
CREATE MATERIALIZED VIEW inventory_category_analytics AS
SELECT 
  c.id as category_id,
  c.name as category_name,
  COUNT(DISTINCT p.id) as total_products,
  COUNT(DISTINCT CASE WHEN p.is_active = true THEN p.id END) as active_products,
  COUNT(DISTINCT CASE WHEN il.quantity <= il.reorder_point THEN p.id END) as low_stock_products,
  COUNT(DISTINCT CASE WHEN il.quantity = 0 THEN p.id END) as out_of_stock_products,
  SUM(il.quantity * p.cost) as total_cost_value,
  SUM(il.quantity * p.price) as total_selling_value,
  AVG(il.quantity) as avg_stock_level,
  COUNT(DISTINCT il.branch_id) as branches_with_stock
FROM categories c
LEFT JOIN products p ON c.id = p.category_id
LEFT JOIN inventory_levels il ON p.id = il.product_id
GROUP BY c.id, c.name;

-- Performance Indexes
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_updated_at ON products(updated_at);
CREATE INDEX idx_inventory_levels_reorder ON inventory_levels(reorder_point);
CREATE INDEX idx_inventory_movements_created_at ON inventory_movements(created_at);

-- Function to refresh category analytics
CREATE OR REPLACE FUNCTION refresh_inventory_category_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW inventory_category_analytics;
END;
$$ LANGUAGE plpgsql;

-- Function to get inventory summary metrics
CREATE OR REPLACE FUNCTION get_inventory_summary_metrics(
  p_branch_id UUID DEFAULT NULL,
  p_category_id UUID DEFAULT NULL
)
RETURNS TABLE (
  total_products BIGINT,
  active_products BIGINT,
  total_cost_value NUMERIC,
  total_selling_value NUMERIC,
  low_stock_count BIGINT,
  out_of_stock_count BIGINT,
  total_categories BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH inventory_stats AS (
    SELECT 
      COUNT(DISTINCT p.id) as total_prod,
      COUNT(DISTINCT CASE WHEN p.is_active = true THEN p.id END) as active_prod,
      SUM(il.quantity * p.cost) as cost_val,
      SUM(il.quantity * p.price) as sell_val,
      COUNT(DISTINCT CASE WHEN il.quantity <= il.reorder_point THEN p.id END) as low_stock,
      COUNT(DISTINCT CASE WHEN il.quantity = 0 THEN p.id END) as out_stock
    FROM products p
    LEFT JOIN inventory_levels il ON p.id = il.product_id
    WHERE (p_branch_id IS NULL OR il.branch_id = p_branch_id)
      AND (p_category_id IS NULL OR p.category_id = p_category_id)
  ),
  category_stats AS (
    SELECT COUNT(DISTINCT category_id) as cat_count
    FROM products
    WHERE (p_category_id IS NULL OR category_id = p_category_id)
  )
  SELECT 
    ist.total_prod,
    ist.active_prod,
    COALESCE(ist.cost_val, 0) as total_cost_value,
    COALESCE(ist.sell_val, 0) as total_selling_value,
    ist.low_stock,
    ist.out_stock,
    cs.cat_count
  FROM inventory_stats ist, category_stats cs;
END;
$$ LANGUAGE plpgsql;
```

---

## Express Routes

### Route File: `backend/src/routes/inventorySummary.routes.ts`

```typescript
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRoles, hasPermission } from '../middleware/rbac';
import { asyncHandler } from '../middleware/errorHandler';
import * as inventorySummaryController from '../controllers/inventorySummary.controller';

const router = Router();
router.use(requireAuth);

// Dashboard Analytics
router.get('/inventory/summary', 
  requireRoles(['super_admin', 'inventory_admin', 'manager']),
  hasPermission('inventory.summary.read'),
  asyncHandler(inventorySummaryController.getInventorySummary)
);

router.get('/inventory/summary/metrics', 
  requireRoles(['super_admin', 'inventory_admin', 'manager']),
  hasPermission('inventory.summary.read'),
  asyncHandler(inventorySummaryController.getSummaryMetrics)
);

router.get('/inventory/summary/category-breakdown', 
  requireRoles(['super_admin', 'inventory_admin', 'manager']),
  hasPermission('inventory.summary.read'),
  asyncHandler(inventorySummaryController.getCategoryBreakdown)
);

// Product Management
router.get('/inventory/products/recent', 
  requireRoles(['super_admin', 'inventory_admin', 'inventory_staff']),
  hasPermission('inventory.products.read'),
  asyncHandler(inventorySummaryController.getRecentProducts)
);

router.get('/inventory/products/search', 
  requireRoles(['super_admin', 'inventory_admin', 'inventory_staff']),
  hasPermission('inventory.products.read'),
  asyncHandler(inventorySummaryController.searchProducts)
);

// Stock Management
router.get('/inventory/stock/alerts', 
  requireRoles(['super_admin', 'inventory_admin', 'inventory_staff']),
  hasPermission('inventory.stock.read'),
  asyncHandler(inventorySummaryController.getStockAlerts)
);

router.post('/inventory/stock/reorder', 
  requireRoles(['super_admin', 'inventory_admin']),
  hasPermission('inventory.stock.update'),
  asyncHandler(inventorySummaryController.createReorder)
);

router.get('/inventory/stock/status', 
  requireRoles(['super_admin', 'inventory_admin']),
  hasPermission('inventory.stock.read'),
  asyncHandler(inventorySummaryController.getStockStatus)
);

// Category Analytics
router.get('/inventory/categories/analytics', 
  requireRoles(['super_admin', 'inventory_admin']),
  hasPermission('inventory.categories.read'),
  asyncHandler(inventorySummaryController.getCategoryAnalytics)
);

router.get('/inventory/categories/:id/products', 
  requireRoles(['super_admin', 'inventory_admin', 'inventory_staff']),
  hasPermission('inventory.categories.read'),
  asyncHandler(inventorySummaryController.getCategoryProducts)
);

// Inventory Operations
router.get('/inventory/operations/recent-updates', 
  requireRoles(['super_admin', 'inventory_admin', 'inventory_staff']),
  hasPermission('inventory.operations.read'),
  asyncHandler(inventorySummaryController.getRecentUpdates)
);

router.post('/inventory/operations/stock-adjustment', 
  requireRoles(['super_admin', 'inventory_admin', 'inventory_staff']),
  hasPermission('inventory.operations.update'),
  asyncHandler(inventorySummaryController.adjustStock)
);

// Quick Actions
router.get('/inventory/quick-actions/stats', 
  requireRoles(['super_admin', 'inventory_admin']),
  hasPermission('inventory.summary.read'),
  asyncHandler(inventorySummaryController.getQuickStats)
);

router.post('/inventory/quick-actions/bulk-reorder', 
  requireRoles(['super_admin', 'inventory_admin']),
  hasPermission('inventory.stock.update'),
  asyncHandler(inventorySummaryController.bulkReorder)
);

export default router;
```

---

## Controllers

### Controller: `backend/src/controllers/inventorySummary.controller.ts`

```typescript
import { Request, Response } from 'express';
import { InventorySummaryService } from '../services/inventorySummary.service';

export const getInventorySummary = async (req: Request, res: Response) => {
  const { branch_id, date_from, date_to } = req.query;
  
  const summary = await InventorySummaryService.getInventorySummary({
    branch_id: branch_id as string,
    date_from: date_from as string,
    date_to: date_to as string
  });
  
  res.json({
    success: true,
    data: summary
  });
};

export const getSummaryMetrics = async (req: Request, res: Response) => {
  const { branch_id, category_id } = req.query;
  
  const metrics = await InventorySummaryService.getSummaryMetrics({
    branch_id: branch_id as string,
    category_id: category_id as string
  });
  
  res.json({
    success: true,
    data: metrics
  });
};

export const getCategoryBreakdown = async (req: Request, res: Response) => {
  const { branch_id, include_stock_alerts } = req.query;
  
  const breakdown = await InventorySummaryService.getCategoryBreakdown({
    branch_id: branch_id as string,
    include_stock_alerts: include_stock_alerts === 'true'
  });
  
  res.json({
    success: true,
    data: breakdown
  });
};

export const getRecentProducts = async (req: Request, res: Response) => {
  const { limit = 10, category_id, days = 7 } = req.query;
  
  const products = await InventorySummaryService.getRecentProducts({
    limit: parseInt(limit as string),
    category_id: category_id as string,
    days: parseInt(days as string)
  });
  
  res.json({
    success: true,
    data: products
  });
};

export const searchProducts = async (req: Request, res: Response) => {
  const { search, category_id, status, page = 1, limit = 20 } = req.query;
  
  const products = await InventorySummaryService.searchProducts({
    search: search as string,
    category_id: category_id as string,
    status: status as string,
    page: parseInt(page as string),
    limit: parseInt(limit as string)
  });
  
  res.json({
    success: true,
    data: products
  });
};

export const getStockAlerts = async (req: Request, res: Response) => {
  const { severity, category_id, branch_id } = req.query;
  
  const alerts = await InventorySummaryService.getStockAlerts({
    severity: severity as string,
    category_id: category_id as string,
    branch_id: branch_id as string
  });
  
  res.json({
    success: true,
    data: alerts
  });
};

export const adjustStock = async (req: Request, res: Response) => {
  const { product_id, quantity, adjustment_type, reason, notes } = req.body;
  const userId = req.user.id;
  
  const result = await InventorySummaryService.adjustStock({
    product_id,
    quantity,
    adjustment_type,
    reason,
    notes
  }, userId);
  
  res.json({
    success: true,
    data: result
  });
};

export const getQuickStats = async (req: Request, res: Response) => {
  const stats = await InventorySummaryService.getQuickStats();
  
  res.json({
    success: true,
    data: stats
  });
};
```

---

## Services

### Service: `backend/src/services/inventorySummary.service.ts`

```typescript
import { supabase } from '../config/supabase';
import { CacheService } from './cache.service';

export class InventorySummaryService {
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static async getInventorySummary(filters: any) {
    const cacheKey = `inventory_summary_${JSON.stringify(filters)}`;
    
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const [metrics, categoryBreakdown, recentProducts, stockAlerts] = await Promise.all([
      this.getSummaryMetrics(filters),
      this.getCategoryBreakdown({ ...filters, include_stock_alerts: true }),
      this.getRecentProducts({ limit: 5 }),
      this.getStockAlerts({ severity: 'all' })
    ]);

    const summary = {
      metrics,
      category_breakdown: categoryBreakdown,
      recent_products: recentProducts,
      stock_alerts: stockAlerts,
      last_updated: new Date().toISOString()
    };

    await CacheService.set(cacheKey, summary, this.CACHE_TTL);
    return summary;
  }

  static async getSummaryMetrics(filters: any) {
    const cacheKey = `summary_metrics_${JSON.stringify(filters)}`;
    
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase.rpc('get_inventory_summary_metrics', {
      p_branch_id: filters.branch_id || null,
      p_category_id: filters.category_id || null
    });

    if (error) throw error;

    const metrics = data[0] || {};
    await CacheService.set(cacheKey, metrics, this.CACHE_TTL);
    return metrics;
  }

  static async getCategoryBreakdown(filters: any) {
    const cacheKey = `category_breakdown_${JSON.stringify(filters)}`;
    
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('inventory_category_analytics')
      .select('*')
      .order('total_selling_value', { ascending: false });

    if (error) throw error;

    const breakdown = data?.map(category => ({
      id: category.category_id,
      name: category.category_name,
      total_products: category.total_products,
      active_products: category.active_products,
      low_stock_products: category.low_stock_products,
      out_of_stock_products: category.out_of_stock_products,
      cost_value: parseFloat(category.total_cost_value || 0),
      selling_value: parseFloat(category.total_selling_value || 0),
      avg_stock_level: parseFloat(category.avg_stock_level || 0),
      branches_with_stock: category.branches_with_stock,
      alerts: filters.include_stock_alerts ? {
        low_stock: category.low_stock_products > 0,
        out_of_stock: category.out_of_stock_products > 0
      } : undefined
    })) || [];

    await CacheService.set(cacheKey, breakdown, this.CACHE_TTL);
    return breakdown;
  }

  static async getRecentProducts(filters: any) {
    const { limit = 10, category_id, days = 7 } = filters;
    
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    let query = supabase
      .from('products')
      .select(`
        id,
        sku,
        name,
        price,
        cost,
        updated_at,
        category:category_id (
          id,
          name
        ),
        inventory_levels (
          branch_id,
          quantity,
          reorder_point,
          branches (
            name
          )
        )
      `)
      .gte('updated_at', dateThreshold.toISOString())
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (category_id) {
      query = query.eq('category_id', category_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data?.map(product => ({
      ...product,
      total_stock: product.inventory_levels?.reduce((sum: number, level: any) => sum + level.quantity, 0) || 0,
      low_stock: product.inventory_levels?.some((level: any) => level.quantity <= level.reorder_point) || false
    })) || [];
  }

  static async searchProducts(filters: any) {
    const { search, category_id, status, page = 1, limit = 20 } = filters;

    let query = supabase
      .from('products')
      .select(`
        id,
        sku,
        name,
        price,
        cost,
        is_active,
        category:category_id (
          id,
          name
        ),
        inventory_levels (
          branch_id,
          quantity,
          reorder_point
        )
      `);

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
    }
    if (category_id) {
      query = query.eq('category_id', category_id);
    }
    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: products, error, count } = await query
      .range(from, to)
      .order('name', { ascending: true });

    if (error) throw error;

    return {
      products: products || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    };
  }

  static async getStockAlerts(filters: any) {
    const { severity, category_id, branch_id } = filters;

    let query = supabase
      .from('inventory_levels')
      .select(`
        quantity,
        reorder_point,
        products (
          id,
          sku,
          name,
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

    if (category_id) {
      query = query.eq('products.category_id', category_id);
    }
    if (branch_id) {
      query = query.eq('branch_id', branch_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    const alerts = data?.map(level => {
      let alertType = 'good';
      if (level.quantity === 0) alertType = 'out_of_stock';
      else if (level.quantity <= level.reorder_point) alertType = 'low_stock';

      return {
        product_id: level.products.id,
        sku: level.products.sku,
        product_name: level.products.name,
        category_name: level.products.categories?.name,
        branch_name: level.branches.name,
        current_quantity: level.quantity,
        reorder_point: level.reorder_point,
        alert_type: alertType,
        severity: alertType === 'out_of_stock' ? 'critical' : 
                 alertType === 'low_stock' ? 'warning' : 'info'
      };
    }) || [];

    // Filter by severity if specified
    if (severity && severity !== 'all') {
      return alerts.filter(alert => alert.severity === severity);
    }

    return alerts;
  }

  static async adjustStock(adjustmentData: any, userId: string) {
    const { product_id, quantity, adjustment_type, reason, notes } = adjustmentData;

    // Get current stock level
    const { data: currentStock, error: stockError } = await supabase
      .from('inventory_levels')
      .select('quantity')
      .eq('product_id', product_id)
      .eq('branch_id', adjustmentData.branch_id || (await this.getDefaultBranch()))
      .single();

    if (stockError) throw stockError;

    let newQuantity = currentStock.quantity;
    switch (adjustment_type) {
      case 'add':
        newQuantity += quantity;
        break;
      case 'remove':
        newQuantity -= quantity;
        break;
      case 'set':
        newQuantity = quantity;
        break;
      default:
        throw new Error('Invalid adjustment type');
    }

    if (newQuantity < 0) {
      throw new Error('Insufficient stock for adjustment');
    }

    // Update inventory level
    const { error: updateError } = await supabase
      .from('inventory_levels')
      .update({ 
        quantity: newQuantity,
        last_updated: new Date().toISOString()
      })
      .eq('product_id', product_id)
      .eq('branch_id', adjustmentData.branch_id || (await this.getDefaultBranch()));

    if (updateError) throw updateError;

    // Record movement
    const { error: movementError } = await supabase
      .from('inventory_movements')
      .insert({
        product_id,
        branch_id: adjustmentData.branch_id || (await this.getDefaultBranch()),
        movement_type: 'adjustment',
        quantity: quantity,
        before_quantity: currentStock.quantity,
        after_quantity: newQuantity,
        reason: reason,
        reference: notes,
        created_by: userId
      });

    if (movementError) throw movementError;

    return {
      success: true,
      message: 'Stock adjusted successfully',
      before_quantity: currentStock.quantity,
      after_quantity: newQuantity,
      adjustment: quantity
    };
  }

  static async getQuickStats() {
    const { data: metrics, error } = await supabase.rpc('get_inventory_summary_metrics');
    if (error) throw error;

    const { data: alerts, error: alertError } = await supabase
      .from('inventory_levels')
      .select('quantity, reorder_point')
      .or('quantity.eq.0,quantity.lte.reorder_point');

    if (alertError) throw alertError;

    return {
      total_products: metrics[0]?.total_products || 0,
      active_products: metrics[0]?.active_products || 0,
      total_value: metrics[0]?.total_selling_value || 0,
      low_stock_count: metrics[0]?.low_stock_count || 0,
      out_of_stock_count: metrics[0]?.out_of_stock_count || 0,
      alert_count: alerts?.length || 0
    };
  }

  private static async getDefaultBranch() {
    const { data: branch, error } = await supabase
      .from('branches')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (error) throw error;
    return branch.id;
  }
}
```

---

## Frontend Integration

### API Service: `frontend/src/services/inventorySummaryService.ts`

```typescript
import { apiClient } from './apiClient';

export class InventorySummaryService {
  static async getInventorySummary(branchId?: string, dateFrom?: string, dateTo?: string) {
    const params = new URLSearchParams();
    if (branchId) params.append('branch_id', branchId);
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);

    const response = await apiClient.get(`/api/v1/inventory/summary?${params.toString()}`);
    return response.data;
  }

  static async getSummaryMetrics(branchId?: string, categoryId?: string) {
    const params = new URLSearchParams();
    if (branchId) params.append('branch_id', branchId);
    if (categoryId) params.append('category_id', categoryId);

    const response = await apiClient.get(`/api/v1/inventory/summary/metrics?${params.toString()}`);
    return response.data;
  }

  static async getCategoryBreakdown(branchId?: string, includeStockAlerts = false) {
    const params = new URLSearchParams();
    if (branchId) params.append('branch_id', branchId);
    if (includeStockAlerts) params.append('include_stock_alerts', 'true');

    const response = await apiClient.get(`/api/v1/inventory/summary/category-breakdown?${params.toString()}`);
    return response.data;
  }

  static async getRecentProducts(limit = 10, categoryId?: string, days = 7) {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('days', days.toString());
    if (categoryId) params.append('category_id', categoryId);

    const response = await apiClient.get(`/api/v1/inventory/products/recent?${params.toString()}`);
    return response.data;
  }

  static async searchProducts(search: string, categoryId?: string, status?: string, page = 1, limit = 20) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (categoryId) params.append('category_id', categoryId);
    if (status) params.append('status', status);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await apiClient.get(`/api/v1/inventory/products/search?${params.toString()}`);
    return response.data;
  }

  static async getStockAlerts(severity?: string, categoryId?: string, branchId?: string) {
    const params = new URLSearchParams();
    if (severity) params.append('severity', severity);
    if (categoryId) params.append('category_id', categoryId);
    if (branchId) params.append('branch_id', branchId);

    const response = await apiClient.get(`/api/v1/inventory/stock/alerts?${params.toString()}`);
    return response.data;
  }

  static async adjustStock(productId: string, quantity: number, adjustmentType: string, reason: string, notes?: string) {
    const response = await apiClient.post('/api/v1/inventory/operations/stock-adjustment', {
      product_id: productId,
      quantity,
      adjustment_type: adjustmentType,
      reason,
      notes
    });
    return response.data;
  }

  static async getQuickStats() {
    const response = await apiClient.get('/api/v1/inventory/quick-actions/stats');
    return response.data;
  }
}
```

---

## Implementation Plan

### Step 1: Database Setup
**Files to create:**
- `backend/supabase/migrations/001_create_inventory_summary_views.sql`

**Tasks:**
1. Create materialized view for category analytics
2. Add performance indexes
3. Create inventory summary functions
4. Test all database functions

### Step 2: Backend Services
**Files to create:**
- `backend/src/services/inventorySummary.service.ts`
- `backend/src/controllers/inventorySummary.controller.ts`
- `backend/src/routes/inventorySummary.routes.ts`

**Tasks:**
1. Implement InventorySummaryService with caching
2. Create all controller methods
3. Set up route definitions with RBAC
4. Add validation and error handling

### Step 3: Frontend Integration
**Files to create:**
- `frontend/src/services/inventorySummaryService.ts`
- `frontend/src/hooks/useInventorySummary.ts`

**Tasks:**
1. Create API service layer
2. Implement React hooks for state management
3. Add real-time data refresh
4. Test all summary endpoints

### Acceptance Criteria
- Summary dashboard loads within 2 seconds
- Category breakdown shows accurate metrics
- Stock alerts work correctly
- Search and filtering work properly
- Quick actions function correctly
- Export functionality generates reports
- RBAC prevents unauthorized access

This implementation provides a comprehensive inventory summary system with real-time analytics, category breakdown, and quick actions for efficient inventory management.
