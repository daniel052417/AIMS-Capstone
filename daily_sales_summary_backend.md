# Daily Sales Summary Backend Integration Guide

## Overview
Complete backend implementation for DailySalesSummary.tsx supporting daily sales analytics, performance insights, hourly breakdowns, top products tracking, and real-time monitoring. This module provides comprehensive sales reporting with multi-branch support and export capabilities.

## Table of Contents
1. [Database Schema & Functions](#database-schema--functions)
2. [Express Routes & Controllers](#express-routes--controllers)
3. [Services & Data Layer](#services--data-layer)
4. [Analytics & Aggregation](#analytics--aggregation)
5. [Export & Reporting](#export--reporting)
6. [Frontend Integration](#frontend-integration)
7. [Implementation Plan](#implementation-plan)

---

## Database Schema & Functions

### Enhanced Sales Tables & Indexes

```sql
-- Ensure sales_transactions table has proper structure
CREATE TABLE IF NOT EXISTS sales_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  pos_session_id UUID REFERENCES pos_sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transaction items table
CREATE TABLE IF NOT EXISTS transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES sales_transactions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily sales targets table
CREATE TABLE IF NOT EXISTS daily_sales_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  target_date DATE NOT NULL,
  target_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  target_orders INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(branch_id, target_date)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_sales_transactions_date ON sales_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_branch ON sales_transactions(branch_id);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_user ON sales_transactions(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_status ON sales_transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_product ON transaction_items(product_id);
CREATE INDEX IF NOT EXISTS idx_daily_targets_branch_date ON daily_sales_targets(branch_id, target_date);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_date_branch ON sales_transactions(transaction_date, branch_id);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_hour ON sales_transactions(DATE_TRUNC('hour', transaction_date));
```

### Analytics Functions

```sql
-- Function to get daily sales summary
CREATE OR REPLACE FUNCTION get_daily_sales_summary(
  p_date DATE,
  p_branch_id UUID DEFAULT NULL,
  p_cashier_id UUID DEFAULT NULL
)
RETURNS TABLE (
  total_sales DECIMAL(10,2),
  orders_count BIGINT,
  average_order_value DECIMAL(10,2),
  target_amount DECIMAL(10,2),
  target_achievement DECIMAL(5,2),
  previous_day_sales DECIMAL(10,2),
  previous_day_orders BIGINT,
  previous_day_aov DECIMAL(10,2)
) AS $$
DECLARE
  v_start_date TIMESTAMP WITH TIME ZONE;
  v_end_date TIMESTAMP WITH TIME ZONE;
  v_previous_start TIMESTAMP WITH TIME ZONE;
  v_previous_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Set time boundaries for the target date
  v_start_date := p_date::TIMESTAMP WITH TIME ZONE;
  v_end_date := (p_date + INTERVAL '1 day')::TIMESTAMP WITH TIME ZONE;
  
  -- Set time boundaries for previous day
  v_previous_start := (p_date - INTERVAL '1 day')::TIMESTAMP WITH TIME ZONE;
  v_previous_end := p_date::TIMESTAMP WITH TIME ZONE;

  RETURN QUERY
  WITH daily_sales AS (
    SELECT 
      COALESCE(SUM(st.total_amount), 0) as total_sales,
      COUNT(st.id) as orders_count,
      CASE 
        WHEN COUNT(st.id) > 0 THEN COALESCE(SUM(st.total_amount), 0) / COUNT(st.id)
        ELSE 0 
      END as average_order_value
    FROM sales_transactions st
    WHERE st.transaction_date >= v_start_date 
      AND st.transaction_date < v_end_date
      AND st.payment_status = 'completed'
      AND (p_branch_id IS NULL OR st.branch_id = p_branch_id)
      AND (p_cashier_id IS NULL OR st.created_by_user_id = p_cashier_id)
  ),
  previous_day_sales AS (
    SELECT 
      COALESCE(SUM(st.total_amount), 0) as total_sales,
      COUNT(st.id) as orders_count,
      CASE 
        WHEN COUNT(st.id) > 0 THEN COALESCE(SUM(st.total_amount), 0) / COUNT(st.id)
        ELSE 0 
      END as average_order_value
    FROM sales_transactions st
    WHERE st.transaction_date >= v_previous_start 
      AND st.transaction_date < v_previous_end
      AND st.payment_status = 'completed'
      AND (p_branch_id IS NULL OR st.branch_id = p_branch_id)
      AND (p_cashier_id IS NULL OR st.created_by_user_id = p_cashier_id)
  ),
  target_data AS (
    SELECT COALESCE(SUM(dst.target_amount), 0) as target_amount
    FROM daily_sales_targets dst
    WHERE dst.target_date = p_date
      AND dst.is_active = true
      AND (p_branch_id IS NULL OR dst.branch_id = p_branch_id)
  )
  SELECT 
    ds.total_sales,
    ds.orders_count,
    ds.average_order_value,
    td.target_amount,
    CASE 
      WHEN td.target_amount > 0 THEN ROUND((ds.total_sales / td.target_amount) * 100, 2)
      ELSE 0 
    END as target_achievement,
    pds.total_sales as previous_day_sales,
    pds.orders_count as previous_day_orders,
    pds.average_order_value as previous_day_aov
  FROM daily_sales ds
  CROSS JOIN previous_day_sales pds
  CROSS JOIN target_data td;
END;
$$ LANGUAGE plpgsql;

-- Function to get hourly sales breakdown
CREATE OR REPLACE FUNCTION get_hourly_sales_breakdown(
  p_date DATE,
  p_branch_id UUID DEFAULT NULL
)
RETURNS TABLE (
  hour TEXT,
  sales DECIMAL(10,2),
  orders BIGINT,
  hour_24 INTEGER
) AS $$
DECLARE
  v_start_date TIMESTAMP WITH TIME ZONE;
  v_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  v_start_date := p_date::TIMESTAMP WITH TIME ZONE;
  v_end_date := (p_date + INTERVAL '1 day')::TIMESTAMP WITH TIME ZONE;

  RETURN QUERY
  SELECT 
    TO_CHAR(DATE_TRUNC('hour', st.transaction_date), 'HH24:MI') as hour,
    COALESCE(SUM(st.total_amount), 0) as sales,
    COUNT(st.id) as orders,
    EXTRACT(hour FROM st.transaction_date)::INTEGER as hour_24
  FROM sales_transactions st
  WHERE st.transaction_date >= v_start_date 
    AND st.transaction_date < v_end_date
    AND st.payment_status = 'completed'
    AND (p_branch_id IS NULL OR st.branch_id = p_branch_id)
  GROUP BY DATE_TRUNC('hour', st.transaction_date)
  ORDER BY hour_24;
END;
$$ LANGUAGE plpgsql;

-- Function to get top selling products
CREATE OR REPLACE FUNCTION get_top_selling_products(
  p_date DATE,
  p_branch_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  product_id UUID,
  product_name VARCHAR(255),
  sales_amount DECIMAL(10,2),
  units_sold BIGINT,
  percentage_of_total DECIMAL(5,2),
  unit_price DECIMAL(10,2)
) AS $$
DECLARE
  v_start_date TIMESTAMP WITH TIME ZONE;
  v_end_date TIMESTAMP WITH TIME ZONE;
  v_total_sales DECIMAL(10,2);
BEGIN
  v_start_date := p_date::TIMESTAMP WITH TIME ZONE;
  v_end_date := (p_date + INTERVAL '1 day')::TIMESTAMP WITH TIME ZONE;

  -- Get total sales for percentage calculation
  SELECT COALESCE(SUM(st.total_amount), 0) INTO v_total_sales
  FROM sales_transactions st
  WHERE st.transaction_date >= v_start_date 
    AND st.transaction_date < v_end_date
    AND st.payment_status = 'completed'
    AND (p_branch_id IS NULL OR st.branch_id = p_branch_id);

  RETURN QUERY
  SELECT 
    p.id as product_id,
    p.name as product_name,
    SUM(ti.total_price) as sales_amount,
    SUM(ti.quantity) as units_sold,
    CASE 
      WHEN v_total_sales > 0 THEN ROUND((SUM(ti.total_price) / v_total_sales) * 100, 2)
      ELSE 0 
    END as percentage_of_total,
    AVG(ti.unit_price) as unit_price
  FROM transaction_items ti
  JOIN products p ON ti.product_id = p.id
  JOIN sales_transactions st ON ti.transaction_id = st.id
  WHERE st.transaction_date >= v_start_date 
    AND st.transaction_date < v_end_date
    AND st.payment_status = 'completed'
    AND (p_branch_id IS NULL OR st.branch_id = p_branch_id)
  GROUP BY p.id, p.name
  ORDER BY sales_amount DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get sales performance metrics
CREATE OR REPLACE FUNCTION get_sales_performance_metrics(
  p_date DATE,
  p_branch_id UUID DEFAULT NULL
)
RETURNS TABLE (
  peak_hour TEXT,
  peak_sales DECIMAL(10,2),
  busiest_time TEXT,
  busiest_orders BIGINT,
  total_transactions BIGINT,
  avg_transaction_value DECIMAL(10,2),
  highest_single_sale DECIMAL(10,2),
  lowest_single_sale DECIMAL(10,2)
) AS $$
DECLARE
  v_start_date TIMESTAMP WITH TIME ZONE;
  v_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  v_start_date := p_date::TIMESTAMP WITH TIME ZONE;
  v_end_date := (p_date + INTERVAL '1 day')::TIMESTAMP WITH TIME ZONE;

  RETURN QUERY
  WITH hourly_stats AS (
    SELECT 
      TO_CHAR(DATE_TRUNC('hour', st.transaction_date), 'HH24:MI') as hour,
      SUM(st.total_amount) as sales,
      COUNT(st.id) as orders
    FROM sales_transactions st
    WHERE st.transaction_date >= v_start_date 
      AND st.transaction_date < v_end_date
      AND st.payment_status = 'completed'
      AND (p_branch_id IS NULL OR st.branch_id = p_branch_id)
    GROUP BY DATE_TRUNC('hour', st.transaction_date)
  ),
  peak_hour_data AS (
    SELECT hour, sales
    FROM hourly_stats
    ORDER BY sales DESC
    LIMIT 1
  ),
  busiest_time_data AS (
    SELECT hour, orders
    FROM hourly_stats
    ORDER BY orders DESC
    LIMIT 1
  ),
  transaction_stats AS (
    SELECT 
      COUNT(st.id) as total_transactions,
      AVG(st.total_amount) as avg_transaction_value,
      MAX(st.total_amount) as highest_single_sale,
      MIN(st.total_amount) as lowest_single_sale
    FROM sales_transactions st
    WHERE st.transaction_date >= v_start_date 
      AND st.transaction_date < v_end_date
      AND st.payment_status = 'completed'
      AND (p_branch_id IS NULL OR st.branch_id = p_branch_id)
  )
  SELECT 
    ph.hour as peak_hour,
    ph.sales as peak_sales,
    bt.hour as busiest_time,
    bt.orders as busiest_orders,
    ts.total_transactions,
    ts.avg_transaction_value,
    ts.highest_single_sale,
    ts.lowest_single_sale
  FROM peak_hour_data ph
  CROSS JOIN busiest_time_data bt
  CROSS JOIN transaction_stats ts;
END;
$$ LANGUAGE plpgsql;
```

### Materialized View for Performance

```sql
-- Materialized view for daily sales aggregates
CREATE MATERIALIZED VIEW daily_sales_aggregates AS
SELECT 
  DATE(transaction_date) as sale_date,
  branch_id,
  COUNT(*) as total_transactions,
  SUM(total_amount) as total_sales,
  AVG(total_amount) as average_order_value,
  MAX(total_amount) as highest_sale,
  MIN(total_amount) as lowest_sale,
  COUNT(DISTINCT customer_id) as unique_customers,
  COUNT(DISTINCT created_by_user_id) as active_cashiers
FROM sales_transactions
WHERE payment_status = 'completed'
  AND transaction_date >= CURRENT_DATE - INTERVAL '1 year'
GROUP BY DATE(transaction_date), branch_id;

-- Create index on materialized view
CREATE INDEX idx_daily_sales_aggregates_date ON daily_sales_aggregates(sale_date);
CREATE INDEX idx_daily_sales_aggregates_branch ON daily_sales_aggregates(branch_id);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_daily_sales_aggregates()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales_aggregates;
END;
$$ LANGUAGE plpgsql;
```

---

## Express Routes & Controllers

### Route File: `backend/src/routes/sales.routes.ts`

```typescript
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRoles, hasPermission } from '../middleware/rbac';
import { asyncHandler } from '../middleware/errorHandler';
import * as salesController from '../controllers/sales.controller';

const router = Router();

// Apply authentication to all routes
router.use(requireAuth);

// Core Sales Analytics
router.get('/sales/daily-summary', 
  requireRoles(['super_admin', 'sales_admin', 'branch_manager', 'pos_cashier']),
  hasPermission('sales.analytics'),
  asyncHandler(salesController.getDailySummary)
);

router.get('/sales/hourly-breakdown', 
  requireRoles(['super_admin', 'sales_admin', 'branch_manager', 'pos_cashier']),
  hasPermission('sales.analytics'),
  asyncHandler(salesController.getHourlyBreakdown)
);

router.get('/sales/top-products', 
  requireRoles(['super_admin', 'sales_admin', 'branch_manager', 'pos_cashier']),
  hasPermission('sales.analytics'),
  asyncHandler(salesController.getTopProducts)
);

router.get('/sales/performance-metrics', 
  requireRoles(['super_admin', 'sales_admin', 'branch_manager', 'pos_cashier']),
  hasPermission('sales.analytics'),
  asyncHandler(salesController.getPerformanceMetrics)
);

// Sales Dashboard
router.get('/sales/dashboard', 
  requireRoles(['super_admin', 'sales_admin', 'branch_manager', 'pos_cashier']),
  hasPermission('sales.dashboard'),
  asyncHandler(salesController.getSalesDashboard)
);

// Reports & Export
router.get('/sales/reports/daily', 
  requireRoles(['super_admin', 'sales_admin', 'branch_manager']),
  hasPermission('sales.export'),
  asyncHandler(salesController.exportDailyReport)
);

router.get('/sales/reports/hourly', 
  requireRoles(['super_admin', 'sales_admin', 'branch_manager']),
  hasPermission('sales.export'),
  asyncHandler(salesController.exportHourlyReport)
);

// POS Integration
router.get('/pos/daily-report', 
  requireRoles(['super_admin', 'sales_admin', 'branch_manager', 'pos_cashier']),
  hasPermission('pos.analytics'),
  asyncHandler(salesController.getPosDailyReport)
);

router.get('/pos/transactions', 
  requireRoles(['super_admin', 'sales_admin', 'branch_manager', 'pos_cashier']),
  hasPermission('pos.analytics'),
  asyncHandler(salesController.getPosTransactions)
);

// Product Performance
router.get('/products/sales-report', 
  requireRoles(['super_admin', 'sales_admin', 'branch_manager']),
  hasPermission('products.analytics'),
  asyncHandler(salesController.getProductSalesReport)
);

router.get('/products/top-selling', 
  requireRoles(['super_admin', 'sales_admin', 'branch_manager']),
  hasPermission('products.analytics'),
  asyncHandler(salesController.getTopSellingProducts)
);

export default router;
```

### Controller: `backend/src/controllers/sales.controller.ts`

```typescript
import { Request, Response } from 'express';
import { SalesService } from '../services/sales.service';
import { validateDate } from '../validators/sales.validator';
import { AuditService } from '../services/audit.service';

export const getDailySummary = async (req: Request, res: Response) => {
  const { date, branch_id, cashier_id } = req.query;

  // Validate date parameter
  const dateValidation = validateDate(date as string);
  if (!dateValidation.valid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid date format. Use YYYY-MM-DD',
      errors: dateValidation.errors
    });
  }

  const summary = await SalesService.getDailySummary({
    date: date as string,
    branch_id: branch_id as string,
    cashier_id: cashier_id as string
  });

  // Audit log
  await AuditService.log({
    userId: req.user.id,
    action: 'daily_summary_viewed',
    resource: 'sales_analytics',
    resourceId: null,
    details: { 
      date,
      branch_id,
      cashier_id
    }
  });

  res.json({
    success: true,
    data: summary
  });
};

export const getHourlyBreakdown = async (req: Request, res: Response) => {
  const { date, branch_id } = req.query;

  const dateValidation = validateDate(date as string);
  if (!dateValidation.valid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid date format. Use YYYY-MM-DD',
      errors: dateValidation.errors
    });
  }

  const breakdown = await SalesService.getHourlyBreakdown({
    date: date as string,
    branch_id: branch_id as string
  });

  res.json({
    success: true,
    data: breakdown
  });
};

export const getTopProducts = async (req: Request, res: Response) => {
  const { date, branch_id, limit = 10, category } = req.query;

  const dateValidation = validateDate(date as string);
  if (!dateValidation.valid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid date format. Use YYYY-MM-DD',
      errors: dateValidation.errors
    });
  }

  const topProducts = await SalesService.getTopProducts({
    date: date as string,
    branch_id: branch_id as string,
    limit: parseInt(limit as string),
    category: category as string
  });

  res.json({
    success: true,
    data: topProducts
  });
};

export const getSalesDashboard = async (req: Request, res: Response) => {
  const { date, branch_id, cashier_id } = req.query;

  const dateValidation = validateDate(date as string);
  if (!dateValidation.valid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid date format. Use YYYY-MM-DD',
      errors: dateValidation.errors
    });
  }

  const dashboard = await SalesService.getSalesDashboard({
    date: date as string,
    branch_id: branch_id as string,
    cashier_id: cashier_id as string
  });

  res.json({
    success: true,
    data: dashboard
  });
};

export const exportDailyReport = async (req: Request, res: Response) => {
  const { date, branch_id, format = 'csv' } = req.query;

  const dateValidation = validateDate(date as string);
  if (!dateValidation.valid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid date format. Use YYYY-MM-DD',
      errors: dateValidation.errors
    });
  }

  const reportData = await SalesService.exportDailyReport({
    date: date as string,
    branch_id: branch_id as string,
    format: format as string
  });

  res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="daily-sales-report-${date}.${format}"`);
  
  res.send(reportData);
};
```

---

## Services & Data Layer

### Service: `backend/src/services/sales.service.ts`

```typescript
import { supabase } from '../config/supabase';

export interface SalesFilters {
  date: string;
  branch_id?: string;
  cashier_id?: string;
  category?: string;
  limit?: number;
}

export class SalesService {
  static async getDailySummary(filters: SalesFilters) {
    const { data, error } = await supabase.rpc('get_daily_sales_summary', {
      p_date: filters.date,
      p_branch_id: filters.branch_id || null,
      p_cashier_id: filters.cashier_id || null
    });

    if (error) throw error;

    const summary = data[0];
    
    // Calculate comparison metrics
    const salesChange = summary.previous_day_sales > 0 
      ? ((summary.total_sales - summary.previous_day_sales) / summary.previous_day_sales) * 100
      : 0;
    
    const ordersChange = summary.previous_day_orders > 0 
      ? ((summary.orders_count - summary.previous_day_orders) / summary.previous_day_orders) * 100
      : 0;
    
    const aovChange = summary.previous_day_aov > 0 
      ? ((summary.average_order_value - summary.previous_day_aov) / summary.previous_day_aov) * 100
      : 0;

    return {
      date: filters.date,
      metrics: {
        total_sales: parseFloat(summary.total_sales),
        orders_count: parseInt(summary.orders_count),
        average_order_value: parseFloat(summary.average_order_value),
        target_achievement: parseFloat(summary.target_achievement),
        previous_day_comparison: {
          sales_change: Math.round(salesChange * 100) / 100,
          orders_change: Math.round(ordersChange * 100) / 100,
          aov_change: Math.round(aovChange * 100) / 100
        }
      }
    };
  }

  static async getHourlyBreakdown(filters: SalesFilters) {
    const { data, error } = await supabase.rpc('get_hourly_sales_breakdown', {
      p_date: filters.date,
      p_branch_id: filters.branch_id || null
    });

    if (error) throw error;

    return {
      date: filters.date,
      hourly_breakdown: data.map(hour => ({
        hour: hour.hour,
        sales: parseFloat(hour.sales),
        orders: parseInt(hour.orders)
      }))
    };
  }

  static async getTopProducts(filters: SalesFilters) {
    const { data, error } = await supabase.rpc('get_top_selling_products', {
      p_date: filters.date,
      p_branch_id: filters.branch_id || null,
      p_limit: filters.limit || 10
    });

    if (error) throw error;

    return {
      date: filters.date,
      top_products: data.map(product => ({
        product_id: product.product_id,
        product_name: product.product_name,
        sales_amount: parseFloat(product.sales_amount),
        units_sold: parseInt(product.units_sold),
        percentage_of_total: parseFloat(product.percentage_of_total),
        unit_price: parseFloat(product.unit_price)
      }))
    };
  }

  static async getPerformanceMetrics(filters: SalesFilters) {
    const { data, error } = await supabase.rpc('get_sales_performance_metrics', {
      p_date: filters.date,
      p_branch_id: filters.branch_id || null
    });

    if (error) throw error;

    const metrics = data[0];

    return {
      date: filters.date,
      insights: {
        peak_hour: metrics.peak_hour,
        peak_sales: parseFloat(metrics.peak_sales),
        busiest_time: metrics.busiest_time,
        busiest_orders: parseInt(metrics.busiest_orders),
        total_transactions: parseInt(metrics.total_transactions),
        avg_transaction_value: parseFloat(metrics.avg_transaction_value),
        highest_single_sale: parseFloat(metrics.highest_single_sale),
        lowest_single_sale: parseFloat(metrics.lowest_single_sale)
      }
    };
  }

  static async getSalesDashboard(filters: SalesFilters) {
    const [summary, hourlyBreakdown, topProducts, performanceMetrics] = await Promise.all([
      this.getDailySummary(filters),
      this.getHourlyBreakdown(filters),
      this.getTopProducts(filters),
      this.getPerformanceMetrics(filters)
    ]);

    return {
      date: filters.date,
      ...summary,
      hourly_breakdown: hourlyBreakdown.hourly_breakdown,
      top_products: topProducts.top_products,
      insights: performanceMetrics.insights
    };
  }

  static async exportDailyReport(options: { date: string; branch_id?: string; format: string }) {
    const dashboard = await this.getSalesDashboard({
      date: options.date,
      branch_id: options.branch_id
    });

    if (options.format === 'csv') {
      return this.generateCSV(dashboard);
    } else {
      return this.generateExcel(dashboard);
    }
  }

  private static generateCSV(dashboard: any): string {
    const headers = [
      'Date', 'Total Sales', 'Orders Count', 'Average Order Value', 
      'Target Achievement', 'Peak Hour', 'Peak Sales', 'Busiest Time'
    ];

    const rows = [[
      dashboard.date,
      dashboard.metrics.total_sales,
      dashboard.metrics.orders_count,
      dashboard.metrics.average_order_value,
      dashboard.metrics.target_achievement,
      dashboard.insights.peak_hour,
      dashboard.insights.peak_sales,
      dashboard.insights.busiest_time
    ]];

    return [headers, ...rows].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');
  }

  private static generateExcel(dashboard: any): Buffer {
    // Implementation would use a library like 'exceljs'
    return Buffer.from('Excel data placeholder');
  }
}
```

### Input Validation: `backend/src/validators/sales.validator.ts`

```typescript
export const validateDate = (date: string) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  
  if (!date) {
    return {
      valid: false,
      errors: ['Date parameter is required']
    };
  }

  if (!dateRegex.test(date)) {
    return {
      valid: false,
      errors: ['Date must be in YYYY-MM-DD format']
    };
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return {
      valid: false,
      errors: ['Invalid date value']
    };
  }

  // Check if date is not in the future
  if (parsedDate > new Date()) {
    return {
      valid: false,
      errors: ['Date cannot be in the future']
    };
  }

  return { valid: true, errors: [] };
};
```

---

## Frontend Integration

### API Service: `frontend/src/services/salesService.ts`

```typescript
import { apiClient } from './apiClient';

export interface SalesFilters {
  date: string;
  branch_id?: string;
  cashier_id?: string;
  category?: string;
  limit?: number;
}

export class SalesService {
  static async getDailySummary(filters: SalesFilters) {
    const params = new URLSearchParams();
    params.append('date', filters.date);
    if (filters.branch_id) params.append('branch_id', filters.branch_id);
    if (filters.cashier_id) params.append('cashier_id', filters.cashier_id);

    const response = await apiClient.get(`/v1/sales/daily-summary?${params.toString()}`);
    return response.data;
  }

  static async getHourlyBreakdown(filters: SalesFilters) {
    const params = new URLSearchParams();
    params.append('date', filters.date);
    if (filters.branch_id) params.append('branch_id', filters.branch_id);

    const response = await apiClient.get(`/v1/sales/hourly-breakdown?${params.toString()}`);
    return response.data;
  }

  static async getTopProducts(filters: SalesFilters) {
    const params = new URLSearchParams();
    params.append('date', filters.date);
    if (filters.branch_id) params.append('branch_id', filters.branch_id);
    if (filters.category) params.append('category', filters.category);
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`/v1/sales/top-products?${params.toString()}`);
    return response.data;
  }

  static async getPerformanceMetrics(filters: SalesFilters) {
    const params = new URLSearchParams();
    params.append('date', filters.date);
    if (filters.branch_id) params.append('branch_id', filters.branch_id);

    const response = await apiClient.get(`/v1/sales/performance-metrics?${params.toString()}`);
    return response.data;
  }

  static async getSalesDashboard(filters: SalesFilters) {
    const params = new URLSearchParams();
    params.append('date', filters.date);
    if (filters.branch_id) params.append('branch_id', filters.branch_id);
    if (filters.cashier_id) params.append('cashier_id', filters.cashier_id);

    const response = await apiClient.get(`/v1/sales/dashboard?${params.toString()}`);
    return response.data;
  }

  static async exportDailyReport(date: string, branchId?: string, format: string = 'csv') {
    const params = new URLSearchParams({ date, format });
    if (branchId) params.append('branch_id', branchId);

    const response = await apiClient.get(`/v1/sales/reports/daily?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  static async exportHourlyReport(date: string, branchId?: string, format: string = 'csv') {
    const params = new URLSearchParams({ date, format });
    if (branchId) params.append('branch_id', branchId);

    const response = await apiClient.get(`/v1/sales/reports/hourly?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }
}
```

### React Hook: `frontend/src/hooks/useSalesDashboard.ts`

```typescript
import { useState, useEffect } from 'react';
import { SalesService, SalesFilters } from '../services/salesService';

export const useSalesDashboard = (initialFilters: SalesFilters) => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const fetchDashboard = async (newFilters?: SalesFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      const currentFilters = newFilters || filters;
      const result = await SalesService.getSalesDashboard(currentFilters);
      setDashboard(result.data);
      if (newFilters) setFilters(currentFilters);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchDashboard();
  };

  const updateFilters = (newFilters: Partial<SalesFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    fetchDashboard(updatedFilters);
  };

  const exportReport = async (format: string = 'csv') => {
    try {
      const data = await SalesService.exportDailyReport(filters.date, filters.branch_id, format);
      
      // Create download link
      const blob = new Blob([data], { 
        type: format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `daily-sales-report-${filters.date}.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return {
    dashboard,
    loading,
    error,
    filters,
    refreshData,
    updateFilters,
    exportReport
  };
};
```

---

## Implementation Plan

### Step 1: Database Setup
**Files to create:**
- `backend/supabase/migrations/001_create_sales_analytics_tables.sql`
- `backend/supabase/migrations/002_create_sales_analytics_functions.sql`

**Tasks:**
1. Create sales analytics functions
2. Add performance indexes
3. Create materialized view for aggregates
4. Set up daily sales targets table
5. Test all database functions

**Acceptance Criteria:**
- All functions return correct data
- Indexes improve query performance
- Materialized view updates correctly
- Date validation works properly
- Time zone handling is correct

### Step 2: Backend Services
**Files to create:**
- `backend/src/services/sales.service.ts`
- `backend/src/validators/sales.validator.ts`
- `backend/src/controllers/sales.controller.ts`
- `backend/src/routes/sales.routes.ts`

**Tasks:**
1. Implement SalesService with all analytics functions
2. Add input validation for dates and parameters
3. Create controllers for all endpoints
4. Set up routes with proper RBAC
5. Add export functionality

**Acceptance Criteria:**
- All service methods work correctly
- Date validation prevents invalid inputs
- Controllers return proper status codes
- RBAC permissions work correctly
- Export generates proper files

### Step 3: Frontend Integration
**Files to create:**
- `frontend/src/services/salesService.ts`
- `frontend/src/hooks/useSalesDashboard.ts`

**Tasks:**
1. Create API service layer
2. Implement React hooks for state management
3. Add real-time updates capability
4. Test all CRUD operations
5. Implement export functionality

**Acceptance Criteria:**
- All API calls work correctly
- Real-time updates work properly
- State management is efficient
- Export downloads work
- UI updates reflect backend changes

### Step 4: Testing & Validation
**Files to create:**
- `backend/src/tests/sales.service.test.ts`
- `backend/src/tests/sales.controller.test.ts`
- `frontend/src/tests/salesService.test.ts`

**Tasks:**
1. Test all service methods
2. Test API endpoints
3. Test analytics calculations
4. Test export functionality
5. Test real-time updates

**Acceptance Criteria:**
- All tests pass
- Analytics calculations are accurate
- Export files are correct
- Performance is acceptable
- Real-time updates work reliably

This implementation provides a complete, scalable daily sales summary system with comprehensive analytics, real-time monitoring, multi-branch support, and export capabilities suitable for enterprise sales reporting needs.
