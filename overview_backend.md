# Overview Dashboard Backend Integration Guide

## Overview
Complete backend implementation for Overview.tsx supporting business intelligence dashboard, real-time KPIs, sales analytics, inventory monitoring, and customer metrics with role-based access control.

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
-- Dashboard Cache Table (for performance optimization)
CREATE TABLE dashboard_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  cache_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time Metrics Table (for live updates)
CREATE TABLE real_time_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(15,2) NOT NULL,
  metric_data JSONB,
  branch_id UUID REFERENCES branches(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Alerts Table
CREATE TABLE system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'info',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  branch_id UUID REFERENCES branches(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX idx_dashboard_cache_key ON dashboard_cache(cache_key);
CREATE INDEX idx_dashboard_cache_expires ON dashboard_cache(expires_at);
CREATE INDEX idx_real_time_metrics_name ON real_time_metrics(metric_name);
CREATE INDEX idx_system_alerts_type ON system_alerts(alert_type);
CREATE INDEX idx_system_alerts_is_read ON system_alerts(is_read);

-- Views for Dashboard Metrics
CREATE OR REPLACE VIEW dashboard_kpis AS
SELECT
  -- Sales KPIs
  COALESCE(SUM(CASE WHEN so.status = 'completed' THEN so.total_amount ELSE 0 END), 0) as total_revenue,
  COUNT(CASE WHEN so.status = 'completed' THEN 1 END) as total_orders,
  COUNT(CASE WHEN so.status = 'pending' THEN 1 END) as active_orders,
  COALESCE(AVG(CASE WHEN so.status = 'completed' THEN so.total_amount END), 0) as avg_order_value,
  
  -- Inventory KPIs
  COUNT(DISTINCT p.id) as total_products,
  COUNT(DISTINCT CASE WHEN il.quantity > 0 THEN p.id END) as products_in_stock,
  COUNT(DISTINCT CASE WHEN il.quantity <= il.reorder_point THEN p.id END) as low_stock_products,
  
  -- Customer KPIs
  COUNT(DISTINCT c.id) as total_customers,
  COUNT(DISTINCT CASE WHEN c.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN c.id END) as new_customers_this_month,
  
  -- Staff KPIs
  COUNT(DISTINCT s.id) as total_staff,
  COUNT(DISTINCT CASE WHEN ar.attendance_date = CURRENT_DATE THEN s.id END) as staff_present_today,
  
  -- Branch KPIs
  COUNT(DISTINCT b.id) as total_branches,
  
  -- Date filters
  CURRENT_DATE as report_date
FROM sales_orders so
FULL OUTER JOIN products p ON 1=1
FULL OUTER JOIN inventory_levels il ON p.id = il.product_id
FULL OUTER JOIN customers c ON 1=1
FULL OUTER JOIN staff s ON 1=1
FULL OUTER JOIN attendance_records ar ON s.id = ar.staff_id
FULL OUTER JOIN branches b ON 1=1;

-- Sales Summary View
CREATE OR REPLACE VIEW sales_summary AS
SELECT
  DATE_TRUNC('day', so.created_at) as sale_date,
  COUNT(*) as order_count,
  SUM(so.total_amount) as total_revenue,
  AVG(so.total_amount) as avg_order_value,
  COUNT(DISTINCT so.customer_id) as unique_customers,
  SUM(oi.quantity) as total_items_sold
FROM sales_orders so
LEFT JOIN order_items oi ON so.id = oi.sales_order_id
WHERE so.status = 'completed'
GROUP BY DATE_TRUNC('day', so.created_at)
ORDER BY sale_date DESC;

-- Inventory Summary View
CREATE OR REPLACE VIEW inventory_summary AS
SELECT
  p.id as product_id,
  p.name as product_name,
  p.sku,
  c.name as category_name,
  il.quantity as current_stock,
  il.reorder_point,
  il.max_stock,
  CASE 
    WHEN il.quantity <= il.reorder_point THEN 'Low Stock'
    WHEN il.quantity = 0 THEN 'Out of Stock'
    ELSE 'In Stock'
  END as stock_status,
  COALESCE(SUM(oi.quantity), 0) as total_sold
FROM products p
LEFT JOIN inventory_levels il ON p.id = il.product_id
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN sales_orders so ON oi.sales_order_id = so.id AND so.status = 'completed'
GROUP BY p.id, p.name, p.sku, c.name, il.quantity, il.reorder_point, il.max_stock;

-- Customer Summary View
CREATE OR REPLACE VIEW customer_summary AS
SELECT
  c.id as customer_id,
  c.first_name,
  c.last_name,
  c.email,
  c.phone,
  c.created_at as registration_date,
  COUNT(so.id) as total_orders,
  COALESCE(SUM(so.total_amount), 0) as total_spent,
  COALESCE(AVG(so.total_amount), 0) as avg_order_value,
  MAX(so.created_at) as last_order_date
FROM customers c
LEFT JOIN sales_orders so ON c.id = so.customer_id AND so.status = 'completed'
GROUP BY c.id, c.first_name, c.last_name, c.email, c.phone, c.created_at;

-- Function to refresh dashboard cache
CREATE OR REPLACE FUNCTION refresh_dashboard_cache()
RETURNS VOID AS $$
BEGIN
  -- Clear expired cache
  DELETE FROM dashboard_cache WHERE expires_at < NOW();
  
  -- Insert fresh KPI data
  INSERT INTO dashboard_cache (cache_key, cache_data, expires_at)
  SELECT 
    'dashboard_kpis',
    to_jsonb(dk.*),
    NOW() + INTERVAL '5 minutes'
  FROM dashboard_kpis dk
  ON CONFLICT (cache_key) DO UPDATE SET
    cache_data = EXCLUDED.cache_data,
    expires_at = EXCLUDED.expires_at;
    
  -- Insert sales summary data
  INSERT INTO dashboard_cache (cache_key, cache_data, expires_at)
  SELECT 
    'sales_summary',
    jsonb_agg(to_jsonb(ss.*)),
    NOW() + INTERVAL '5 minutes'
  FROM sales_summary ss
  WHERE ss.sale_date >= CURRENT_DATE - INTERVAL '30 days'
  ON CONFLICT (cache_key) DO UPDATE SET
    cache_data = EXCLUDED.cache_data,
    expires_at = EXCLUDED.expires_at;
    
  -- Insert inventory summary data
  INSERT INTO dashboard_cache (cache_key, cache_data, expires_at)
  SELECT 
    'inventory_summary',
    jsonb_agg(to_jsonb(is.*)),
    NOW() + INTERVAL '5 minutes'
  FROM inventory_summary is
  ON CONFLICT (cache_key) DO UPDATE SET
    cache_data = EXCLUDED.cache_data,
    expires_at = EXCLUDED.expires_at;
END;
$$ LANGUAGE plpgsql;
```

---

## Express Routes

### Route File: `backend/src/routes/dashboard.routes.ts`

```typescript
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRoles, hasPermission } from '../middleware/rbac';
import { asyncHandler } from '../middleware/errorHandler';
import * as dashboardController from '../controllers/dashboard.controller';

const router = Router();
router.use(requireAuth);

// Dashboard & Analytics
router.get('/dashboard/overview', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('dashboard.read'),
  asyncHandler(dashboardController.getDashboardOverview)
);

router.get('/dashboard/metrics', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('dashboard.read'),
  asyncHandler(dashboardController.getDashboardMetrics)
);

router.get('/dashboard/sales-summary', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('dashboard.read'),
  asyncHandler(dashboardController.getSalesSummary)
);

router.get('/dashboard/inventory-summary', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('dashboard.read'),
  asyncHandler(dashboardController.getInventorySummary)
);

router.get('/dashboard/customer-metrics', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('dashboard.read'),
  asyncHandler(dashboardController.getCustomerMetrics)
);

// Sales Analytics
router.get('/sales/dashboard', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('sales.read'),
  asyncHandler(dashboardController.getSalesDashboard)
);

router.get('/sales/today', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('sales.read'),
  asyncHandler(dashboardController.getTodaySales)
);

router.get('/sales/revenue', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('sales.read'),
  asyncHandler(dashboardController.getRevenueByPeriod)
);

router.get('/sales/orders/active', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('sales.read'),
  asyncHandler(dashboardController.getActiveOrders)
);

router.get('/sales/orders/average-value', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('sales.read'),
  asyncHandler(dashboardController.getAverageOrderValue)
);

router.get('/sales/fulfillment-rate', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('sales.read'),
  asyncHandler(dashboardController.getFulfillmentRate)
);

// Inventory Analytics
router.get('/inventory/dashboard', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('inventory.read'),
  asyncHandler(dashboardController.getInventoryDashboard)
);

router.get('/inventory/products-in-stock', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('inventory.read'),
  asyncHandler(dashboardController.getProductsInStock)
);

router.get('/inventory/low-stock-alerts', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('inventory.read'),
  asyncHandler(dashboardController.getLowStockAlerts)
);

router.get('/inventory/stock-levels', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('inventory.read'),
  asyncHandler(dashboardController.getStockLevels)
);

router.get('/inventory/reorder-points', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('inventory.read'),
  asyncHandler(dashboardController.getReorderPoints)
);

// Customer Analytics
router.get('/customers/dashboard', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('customers.read'),
  asyncHandler(dashboardController.getCustomerDashboard)
);

router.get('/customers/total-count', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('customers.read'),
  asyncHandler(dashboardController.getTotalCustomers)
);

router.get('/customers/new-this-month', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('customers.read'),
  asyncHandler(dashboardController.getNewCustomersThisMonth)
);

router.get('/customers/ratings', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('customers.read'),
  asyncHandler(dashboardController.getCustomerRatings)
);

router.get('/customers/engagement', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('customers.read'),
  asyncHandler(dashboardController.getCustomerEngagement)
);

// Sales by Category
router.get('/sales/by-branch', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('sales.read'),
  asyncHandler(dashboardController.getSalesByBranch)
);

router.get('/sales/by-product', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('sales.read'),
  asyncHandler(dashboardController.getSalesByProduct)
);

router.get('/sales/top-products', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('sales.read'),
  asyncHandler(dashboardController.getTopProducts)
);

router.get('/sales/top-performers', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('sales.read'),
  asyncHandler(dashboardController.getTopPerformers)
);

// Charts & Visualizations
router.get('/charts/sales-trends', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('dashboard.read'),
  asyncHandler(dashboardController.getSalesTrends)
);

router.get('/charts/revenue-chart', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('dashboard.read'),
  asyncHandler(dashboardController.getRevenueChart)
);

router.get('/charts/inventory-chart', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('dashboard.read'),
  asyncHandler(dashboardController.getInventoryChart)
);

router.get('/charts/customer-growth', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('dashboard.read'),
  asyncHandler(dashboardController.getCustomerGrowth)
);

// Recent Activity
router.get('/activity/recent', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('activity.read'),
  asyncHandler(dashboardController.getRecentActivity)
);

router.get('/activity/feed', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('activity.read'),
  asyncHandler(dashboardController.getActivityFeed)
);

router.get('/notifications/alerts', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('notifications.read'),
  asyncHandler(dashboardController.getSystemAlerts)
);

// Real-time Updates
router.get('/dashboard/live-metrics', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('dashboard.read'),
  asyncHandler(dashboardController.getLiveMetrics)
);

router.get('/dashboard/refresh', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('dashboard.read'),
  asyncHandler(dashboardController.refreshDashboard)
);

// Export & Reporting
router.get('/dashboard/export', 
  requireRoles(['super_admin', 'admin']),
  hasPermission('dashboard.export'),
  asyncHandler(dashboardController.exportDashboardData)
);

router.get('/reports/overview', 
  requireRoles(['super_admin', 'admin']),
  hasPermission('reports.read'),
  asyncHandler(dashboardController.generateOverviewReport)
);

router.get('/reports/kpi-summary', 
  requireRoles(['super_admin', 'admin']),
  hasPermission('reports.read'),
  asyncHandler(dashboardController.generateKPISummary)
);

export default router;
```

---

## Controllers

### Controller: `backend/src/controllers/dashboard.controller.ts`

```typescript
import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';

export const getDashboardOverview = async (req: Request, res: Response) => {
  const { branch_id, period = 'monthly' } = req.query;
  
  const overview = await DashboardService.getDashboardOverview({
    branch_id: branch_id as string,
    period: period as string
  });
  
  res.json({
    success: true,
    data: overview
  });
};

export const getDashboardMetrics = async (req: Request, res: Response) => {
  const { branch_id, period = 'monthly' } = req.query;
  
  const metrics = await DashboardService.getDashboardMetrics({
    branch_id: branch_id as string,
    period: period as string
  });
  
  res.json({
    success: true,
    data: metrics
  });
};

export const getSalesSummary = async (req: Request, res: Response) => {
  const { branch_id, start_date, end_date } = req.query;
  
  const summary = await DashboardService.getSalesSummary({
    branch_id: branch_id as string,
    start_date: start_date as string,
    end_date: end_date as string
  });
  
  res.json({
    success: true,
    data: summary
  });
};

export const getInventorySummary = async (req: Request, res: Response) => {
  const { branch_id, category_id } = req.query;
  
  const summary = await DashboardService.getInventorySummary({
    branch_id: branch_id as string,
    category_id: category_id as string
  });
  
  res.json({
    success: true,
    data: summary
  });
};

export const getCustomerMetrics = async (req: Request, res: Response) => {
  const { branch_id, period = 'monthly' } = req.query;
  
  const metrics = await DashboardService.getCustomerMetrics({
    branch_id: branch_id as string,
    period: period as string
  });
  
  res.json({
    success: true,
    data: metrics
  });
};

export const getTodaySales = async (req: Request, res: Response) => {
  const { branch_id } = req.query;
  
  const sales = await DashboardService.getTodaySales({
    branch_id: branch_id as string
  });
  
  res.json({
    success: true,
    data: sales
  });
};

export const getRevenueByPeriod = async (req: Request, res: Response) => {
  const { period = 'monthly', branch_id, start_date, end_date } = req.query;
  
  const revenue = await DashboardService.getRevenueByPeriod({
    period: period as string,
    branch_id: branch_id as string,
    start_date: start_date as string,
    end_date: end_date as string
  });
  
  res.json({
    success: true,
    data: revenue
  });
};

export const getActiveOrders = async (req: Request, res: Response) => {
  const { branch_id } = req.query;
  
  const orders = await DashboardService.getActiveOrders({
    branch_id: branch_id as string
  });
  
  res.json({
    success: true,
    data: orders
  });
};

export const getLowStockAlerts = async (req: Request, res: Response) => {
  const { branch_id, category_id } = req.query;
  
  const alerts = await DashboardService.getLowStockAlerts({
    branch_id: branch_id as string,
    category_id: category_id as string
  });
  
  res.json({
    success: true,
    data: alerts
  });
};

export const getSalesTrends = async (req: Request, res: Response) => {
  const { period = 'monthly', branch_id, start_date, end_date } = req.query;
  
  const trends = await DashboardService.getSalesTrends({
    period: period as string,
    branch_id: branch_id as string,
    start_date: start_date as string,
    end_date: end_date as string
  });
  
  res.json({
    success: true,
    data: trends
  });
};

export const getRecentActivity = async (req: Request, res: Response) => {
  const { limit = 20, activity_type } = req.query;
  
  const activity = await DashboardService.getRecentActivity({
    limit: parseInt(limit as string),
    activity_type: activity_type as string
  });
  
  res.json({
    success: true,
    data: activity
  });
};

export const getLiveMetrics = async (req: Request, res: Response) => {
  const { branch_id } = req.query;
  
  const metrics = await DashboardService.getLiveMetrics({
    branch_id: branch_id as string
  });
  
  res.json({
    success: true,
    data: metrics
  });
};

export const refreshDashboard = async (req: Request, res: Response) => {
  await DashboardService.refreshDashboardCache();
  
  res.json({
    success: true,
    message: 'Dashboard cache refreshed successfully'
  });
};

export const exportDashboardData = async (req: Request, res: Response) => {
  const { format = 'csv', branch_id, period = 'monthly' } = req.query;
  const userId = req.user?.id;
  
  const exportData = await DashboardService.exportDashboardData({
    format: format as string,
    branch_id: branch_id as string,
    period: period as string,
    userId
  });
  
  res.json({
    success: true,
    data: exportData
  });
};
```

---

## Services

### Service: `backend/src/services/dashboard.service.ts`

```typescript
import { supabase } from '../config/supabase';

export class DashboardService {
  static async getDashboardOverview(filters: any) {
    // Try to get from cache first
    const cachedData = await this.getCachedData('dashboard_overview');
    if (cachedData) {
      return cachedData;
    }

    // Get KPIs
    const kpis = await this.getDashboardKPIs(filters);
    
    // Get sales summary
    const salesSummary = await this.getSalesSummary(filters);
    
    // Get inventory summary
    const inventorySummary = await this.getInventorySummary(filters);
    
    // Get customer metrics
    const customerMetrics = await this.getCustomerMetrics(filters);
    
    // Get recent activity
    const recentActivity = await this.getRecentActivity({ limit: 10 });
    
    // Get system alerts
    const systemAlerts = await this.getSystemAlerts({ limit: 5 });

    const overview = {
      kpis,
      sales_summary: salesSummary,
      inventory_summary: inventorySummary,
      customer_metrics: customerMetrics,
      recent_activity: recentActivity,
      system_alerts: systemAlerts,
      last_updated: new Date().toISOString()
    };

    // Cache the result
    await this.setCachedData('dashboard_overview', overview, 300); // 5 minutes

    return overview;
  }

  static async getDashboardKPIs(filters: any) {
    const { data: kpis, error } = await supabase
      .from('dashboard_kpis')
      .select('*')
      .single();

    if (error) throw error;

    // Get period comparisons
    const previousPeriod = await this.getPreviousPeriodKPIs(filters);
    
    // Calculate growth rates
    const revenueGrowth = previousPeriod.total_revenue > 0 ? 
      ((kpis.total_revenue - previousPeriod.total_revenue) / previousPeriod.total_revenue) * 100 : 0;
    
    const orderGrowth = previousPeriod.total_orders > 0 ?
      ((kpis.total_orders - previousPeriod.total_orders) / previousPeriod.total_orders) * 100 : 0;

    return {
      ...kpis,
      revenue_growth: Math.round(revenueGrowth * 100) / 100,
      order_growth: Math.round(orderGrowth * 100) / 100,
      fulfillment_rate: kpis.total_orders > 0 ? 
        Math.round((kpis.active_orders / kpis.total_orders) * 100 * 100) / 100 : 0
    };
  }

  static async getSalesSummary(filters: any) {
    let query = supabase
      .from('sales_summary')
      .select('*')
      .order('sale_date', { ascending: false })
      .limit(30);

    if (filters.start_date) {
      query = query.gte('sale_date', filters.start_date);
    }

    if (filters.end_date) {
      query = query.lte('sale_date', filters.end_date);
    }

    const { data: salesData, error } = await query;

    if (error) throw error;

    // Calculate totals
    const totals = salesData?.reduce((acc, day) => ({
      total_revenue: acc.total_revenue + parseFloat(day.total_revenue || 0),
      total_orders: acc.total_orders + (day.order_count || 0),
      total_items: acc.total_items + (day.total_items_sold || 0)
    }), { total_revenue: 0, total_orders: 0, total_items: 0 }) || { total_revenue: 0, total_orders: 0, total_items: 0 };

    return {
      daily_sales: salesData || [],
      totals,
      avg_daily_revenue: salesData?.length > 0 ? totals.total_revenue / salesData.length : 0,
      avg_daily_orders: salesData?.length > 0 ? totals.total_orders / salesData.length : 0
    };
  }

  static async getInventorySummary(filters: any) {
    let query = supabase
      .from('inventory_summary')
      .select('*');

    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }

    const { data: inventoryData, error } = await query;

    if (error) throw error;

    // Calculate summary statistics
    const summary = {
      total_products: inventoryData?.length || 0,
      in_stock: inventoryData?.filter(item => item.stock_status === 'In Stock').length || 0,
      low_stock: inventoryData?.filter(item => item.stock_status === 'Low Stock').length || 0,
      out_of_stock: inventoryData?.filter(item => item.stock_status === 'Out of Stock').length || 0,
      total_value: inventoryData?.reduce((sum, item) => sum + (item.current_stock * item.unit_price || 0), 0) || 0
    };

    return {
      summary,
      products: inventoryData || [],
      low_stock_alerts: inventoryData?.filter(item => item.stock_status === 'Low Stock') || []
    };
  }

  static async getCustomerMetrics(filters: any) {
    const { data: customers, error } = await supabase
      .from('customer_summary')
      .select('*')
      .order('total_spent', { ascending: false });

    if (error) throw error;

    // Calculate metrics
    const metrics = {
      total_customers: customers?.length || 0,
      new_this_month: customers?.filter(c => 
        new Date(c.registration_date) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      ).length || 0,
      total_revenue: customers?.reduce((sum, c) => sum + parseFloat(c.total_spent || 0), 0) || 0,
      avg_order_value: customers?.length > 0 ? 
        customers.reduce((sum, c) => sum + parseFloat(c.avg_order_value || 0), 0) / customers.length : 0,
      top_customers: customers?.slice(0, 10) || []
    };

    return metrics;
  }

  static async getTodaySales(filters: any) {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: sales, error } = await supabase
      .from('sales_orders')
      .select(`
        id,
        order_number,
        total_amount,
        status,
        created_at,
        customer:customer_id (
          first_name,
          last_name
        )
      `)
      .gte('created_at', today)
      .lte('created_at', today + 'T23:59:59')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const totals = sales?.reduce((acc, order) => ({
      total_revenue: acc.total_revenue + parseFloat(order.total_amount || 0),
      total_orders: acc.total_orders + 1
    }), { total_revenue: 0, total_orders: 0 }) || { total_revenue: 0, total_orders: 0 };

    return {
      sales: sales || [],
      totals,
      avg_order_value: sales?.length > 0 ? totals.total_revenue / sales.length : 0
    };
  }

  static async getRevenueByPeriod(filters: any) {
    const { period, start_date, end_date } = filters;
    
    let dateTrunc = 'day';
    switch (period) {
      case 'weekly': dateTrunc = 'week'; break;
      case 'monthly': dateTrunc = 'month'; break;
      case 'yearly': dateTrunc = 'year'; break;
    }

    const { data: revenue, error } = await supabase
      .rpc('get_revenue_by_period', {
        p_period: dateTrunc,
        p_start_date: start_date,
        p_end_date: end_date
      });

    if (error) throw error;

    return revenue || [];
  }

  static async getLowStockAlerts(filters: any) {
    const { data: alerts, error } = await supabase
      .from('inventory_summary')
      .select('*')
      .eq('stock_status', 'Low Stock')
      .order('current_stock', { ascending: true });

    if (error) throw error;

    return alerts || [];
  }

  static async getSalesTrends(filters: any) {
    const { period, start_date, end_date } = filters;
    
    let query = supabase
      .from('sales_summary')
      .select('*')
      .order('sale_date', { ascending: true });

    if (start_date) {
      query = query.gte('sale_date', start_date);
    }

    if (end_date) {
      query = query.lte('sale_date', end_date);
    }

    const { data: trends, error } = await query;

    if (error) throw error;

    return trends || [];
  }

  static async getRecentActivity(filters: any) {
    const { data: activity, error } = await supabase
      .from('audit_logs')
      .select(`
        id,
        action,
        entity_type,
        entity_id,
        created_at,
        user:user_id (
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(filters.limit || 20);

    if (error) throw error;

    return activity || [];
  }

  static async getSystemAlerts(filters: any) {
    const { data: alerts, error } = await supabase
      .from('system_alerts')
      .select('*')
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(filters.limit || 10);

    if (error) throw error;

    return alerts || [];
  }

  static async getLiveMetrics(filters: any) {
    const { data: metrics, error } = await supabase
      .from('real_time_metrics')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return metrics || [];
  }

  static async refreshDashboardCache() {
    const { error } = await supabase.rpc('refresh_dashboard_cache');
    if (error) throw error;
  }

  static async exportDashboardData(options: any) {
    // This would typically queue a background job for large exports
    const overview = await this.getDashboardOverview({
      branch_id: options.branch_id,
      period: options.period
    });

    return {
      export_id: `export_${Date.now()}`,
      status: 'completed',
      download_url: `/api/dashboard/exports/${options.userId}/overview_${Date.now()}.${options.format}`,
      data: overview
    };
  }

  private static async getCachedData(key: string) {
    const { data, error } = await supabase
      .from('dashboard_cache')
      .select('cache_data')
      .eq('cache_key', key)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) return null;
    return data.cache_data;
  }

  private static async setCachedData(key: string, data: any, ttlSeconds: number) {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    
    await supabase
      .from('dashboard_cache')
      .upsert({
        cache_key: key,
        cache_data: data,
        expires_at: expiresAt
      });
  }

  private static async getPreviousPeriodKPIs(filters: any) {
    // Calculate previous period based on current period
    const now = new Date();
    let startDate, endDate;
    
    switch (filters.period) {
      case 'daily':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        endDate = new Date(now.getTime() - 1);
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = new Date(now.getTime() - 1);
    }

    const { data, error } = await supabase
      .from('sales_orders')
      .select('total_amount, status')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;

    const totals = data?.reduce((acc, order) => ({
      total_revenue: acc.total_revenue + (order.status === 'completed' ? parseFloat(order.total_amount || 0) : 0),
      total_orders: acc.total_orders + (order.status === 'completed' ? 1 : 0)
    }), { total_revenue: 0, total_orders: 0 }) || { total_revenue: 0, total_orders: 0 };

    return totals;
  }
}
```

---

## Frontend Integration

### API Service: `frontend/src/services/dashboardService.ts`

```typescript
import { apiClient } from './apiClient';

export class DashboardService {
  static async getDashboardOverview(filters: any = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, value.toString());
    });

    const response = await apiClient.get(`/api/dashboard/overview?${params.toString()}`);
    return response.data;
  }

  static async getDashboardMetrics(filters: any = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, value.toString());
    });

    const response = await apiClient.get(`/api/dashboard/metrics?${params.toString()}`);
    return response.data;
  }

  static async getSalesSummary(filters: any = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, value.toString());
    });

    const response = await apiClient.get(`/api/dashboard/sales-summary?${params.toString()}`);
    return response.data;
  }

  static async getInventorySummary(filters: any = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, value.toString());
    });

    const response = await apiClient.get(`/api/dashboard/inventory-summary?${params.toString()}`);
    return response.data;
  }

  static async getCustomerMetrics(filters: any = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, value.toString());
    });

    const response = await apiClient.get(`/api/dashboard/customer-metrics?${params.toString()}`);
    return response.data;
  }

  static async getTodaySales(filters: any = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, value.toString());
    });

    const response = await apiClient.get(`/api/sales/today?${params.toString()}`);
    return response.data;
  }

  static async getRevenueByPeriod(period: string, filters: any = {}) {
    const params = new URLSearchParams();
    params.append('period', period);
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, value.toString());
    });

    const response = await apiClient.get(`/api/sales/revenue?${params.toString()}`);
    return response.data;
  }

  static async getLowStockAlerts(filters: any = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, value.toString());
    });

    const response = await apiClient.get(`/api/inventory/low-stock-alerts?${params.toString()}`);
    return response.data;
  }

  static async getSalesTrends(period: string, filters: any = {}) {
    const params = new URLSearchParams();
    params.append('period', period);
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, value.toString());
    });

    const response = await apiClient.get(`/api/charts/sales-trends?${params.toString()}`);
    return response.data;
  }

  static async getRecentActivity(filters: any = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, value.toString());
    });

    const response = await apiClient.get(`/api/activity/recent?${params.toString()}`);
    return response.data;
  }

  static async getLiveMetrics(filters: any = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, value.toString());
    });

    const response = await apiClient.get(`/api/dashboard/live-metrics?${params.toString()}`);
    return response.data;
  }

  static async refreshDashboard() {
    const response = await apiClient.get('/api/dashboard/refresh');
    return response.data;
  }

  static async exportDashboardData(format = 'csv', filters: any = {}) {
    const params = new URLSearchParams();
    params.append('format', format);
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, value.toString());
    });

    const response = await apiClient.get(`/api/dashboard/export?${params.toString()}`);
    return response.data;
  }
}
```

---

## Implementation Plan

### Step 1: Database Setup
**Files to create:**
- `backend/supabase/migrations/003_dashboard_tables.sql`

**Tasks:**
1. Create dashboard_cache, real_time_metrics, system_alerts tables
2. Add performance indexes
3. Create dashboard views (dashboard_kpis, sales_summary, etc.)
4. Create refresh_dashboard_cache function

### Step 2: Backend Services
**Files to create:**
- `backend/src/services/dashboard.service.ts`
- `backend/src/controllers/dashboard.controller.ts`
- `backend/src/routes/dashboard.routes.ts`

**Tasks:**
1. Implement DashboardService with all analytics functions
2. Add caching mechanism for performance
3. Create real-time metrics updates
4. Add export functionality

### Step 3: Frontend Integration
**Files to create:**
- `frontend/src/services/dashboardService.ts`
- `frontend/src/hooks/useDashboard.ts`

**Tasks:**
1. Create API service layer
2. Implement React hooks for state management
3. Add real-time polling for live updates
4. Test all dashboard endpoints

### Step 4: Real-time Updates
**Files to create:**
- `backend/src/services/websocket.service.ts`

**Tasks:**
1. Implement WebSocket for real-time metrics
2. Add event broadcasting for dashboard updates
3. Create frontend WebSocket client

### Step 5: Export & Reporting
**Files to create:**
- `backend/src/services/export.service.ts`

**Tasks:**
1. Implement export functionality
2. Add background job processing
3. Create report generation system

### Acceptance Criteria
- Dashboard displays accurate KPIs and metrics
- Real-time updates work correctly
- Export functionality generates proper reports
- Caching improves performance
- RBAC prevents unauthorized access

This implementation provides a comprehensive business intelligence dashboard with real-time KPIs, sales analytics, inventory monitoring, and customer metrics for enterprise management teams.
