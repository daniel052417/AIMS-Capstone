import { lazy, type ComponentType } from 'react';
import type { RouteComponentProps } from '../App';

// Import shared pages (multi-role access)
const Dashboard = lazy(() => import('../pages/shared/Dashboard'));
const UserManagement = lazy(() => import('../pages/shared/UserAccounts'));
const RolesPermissions = lazy(() => import('../pages/shared/RolesPermissions'));
const UserPermissions = lazy(() => import('../pages/shared/UserPermissions'));
const SharedInventoryManagement = lazy(() => import('../pages/shared/InventoryManagement'));
const SharedSalesDashboard = lazy(() => import('../pages/shared/SalesDashboard'));
const SharedMarketingDashboard = lazy(() => import('../pages/shared/MarketingDashboard'));
const SharedReportsAnalytics = lazy(() => import('../pages/shared/ReportsAnalytics'));
const SharedSettings = lazy(() => import('../pages/shared/Settings'));

// Import admin pages
const AdminOverview = lazy(() => import('../pages/admin/Overview'));
const AdminSettings = lazy(() => import('../pages/admin/Settings'));
const AdminActiveUsers = lazy(() => import('../pages/admin/ActiveUsers'));
const AdminUserActivity = lazy(() => import('../pages/admin/UserActivity'));

// Import inventory pages
const InventorySummary = lazy(() => import('../pages/inventory/InventorySummaryPage'));
const Categories = lazy(() => import('../pages/inventory/Categories'));
const LowStockAlerts = lazy(() => import('../pages/inventory/LowStockAlerts'));

// Import sales pages
const SalesDashboard = lazy(() => import('../pages/sales/SalesDashboard'));
const AllSalesRecords = lazy(() => import('../pages/sales/AllSalesRecords'));
const DailySalesSummary = lazy(() => import('../pages/sales/DailySalesSummary'));
const ProductSalesReport = lazy(() => import('../pages/sales/ProductSalesReport'));
const SalesValue = lazy(() => import('../pages/sales/SalesValue'));

// Import POS pages
const POSDashboard = lazy(() => import('../pages/pos/cashier/POSDashboard'));
const POSInterface = lazy(() => import('../pages/pos/cashier/POSInterface'));
const PaymentProcessing = lazy(() => import('../pages/pos/cashier/PaymentProcessing'));

// Import marketing pages
const MarketingDashboard = lazy(() => import('../pages/marketing/MarketingDashboard'));
const CampaignManagement = lazy(() => import('../pages/marketing/CampaignManagement'));
const CampaignAnalytics = lazy(() => import('../pages/marketing/CampaignAnalytics'));
const CampaignForm = lazy(() => import('../pages/marketing/CampaignForm'));
const TemplateManagement = lazy(() => import('../pages/marketing/TemplateManagement'));
const ClientNotifications = lazy(() => import('../pages/marketing/ClientNotifications'));

// Import reports pages
const ReportsDashboard = lazy(() => import('../pages/reports/ReportsDashboard'));
const ReportsAnalytics = lazy(() => import('../pages/reports/ReportsAnalytics'));
const EventCenter = lazy(() => import('../pages/reports/EventCenter'));
const Exports = lazy(() => import('../pages/reports/Exports'));

// Import HR pages
const HRDashboard = lazy(() => import('../pages/hr/HRDashboard'));
const AddStaff = lazy(() => import('../pages/hr/AddStaff'));
const AttendanceDashboard = lazy(() => import('../pages/hr/AttendanceDashboard'));
const LeaveManagement = lazy(() => import('../pages/hr/LeaveManagement'));
const PayrollCompensation = lazy(() => import('../pages/hr/PayrollCompensation'));

// Unauthorized page
const UnauthorizedPage = lazy(() => import('../pages/UnauthorizedPage'));

export interface RouteConfig {
    path: string;
    component?: ComponentType<any>;    requiredPermissions?: string[];
    requiredRoles?: string[];
    title: string;
    icon?: string;
    children?: RouteConfig[];
}

export const routes: RouteConfig[] = [
  // Dashboard - accessible to all authenticated users
  {
    path: '/dashboard',
    component: Dashboard,
    title: 'Dashboard',
    icon: 'home'
  },

  // Inventory Management Routes
  {
    path: '/inventory',
    component: SharedInventoryManagement, // Using shared inventory management
    requiredPermissions: ['inventory.read'],
    title: 'Inventory Overview',
    icon: 'package'
  },
  {
    path: '/inventory/products',
    component: InventorySummary, // Using your existing InventorySummaryPage
    requiredPermissions: ['products.read'],
    title: 'Products',
    icon: 'archive'
  },
  {
    path: '/inventory/categories',
    component: Categories,
    requiredPermissions: ['products.read'],
    title: 'Categories',
    icon: 'grid'
  },
  {
    path: '/inventory/low-stock',
    component: LowStockAlerts,
    requiredPermissions: ['inventory.read'],
    title: 'Low Stock Alerts',
    icon: 'alert-triangle'
  },
  // Note: You'll need to create Suppliers and Purchase Orders components
  // {
  //   path: '/inventory/suppliers',
  //   component: SuppliersPage, // MISSING - needs to be created
  //   requiredPermissions: ['suppliers.read'],
  //   title: 'Suppliers',
  //   icon: 'truck'
  // },
  // {
  //   path: '/inventory/purchase-orders',
  //   component: PurchaseOrdersPage, // MISSING - needs to be created
  //   requiredPermissions: ['purchase_orders.read'],
  //   title: 'Purchase Orders',
  //   icon: 'file-text'
  // },

  // Sales & POS Routes
  {
    path: '/sales',
    component: SalesDashboard,
    requiredPermissions: ['sales.read'],
    title: 'Sales Dashboard',
    icon: 'trending-up'
  },
  {
    path: '/sales/records',
    component: AllSalesRecords,
    requiredPermissions: ['sales.read'],
    title: 'All Sales Records',
    icon: 'file-text'
  },
  {
    path: '/sales/daily-summary',
    component: DailySalesSummary,
    requiredPermissions: ['sales.read'],
    title: 'Daily Sales Summary',
    icon: 'calendar'
  },
  {
    path: '/sales/product-report',
    component: ProductSalesReport,
    requiredPermissions: ['sales.read'],
    title: 'Product Sales Report',
    icon: 'bar-chart'
  },
  {
    path: '/sales/value',
    component: SalesValue,
    requiredPermissions: ['sales.read'],
    title: 'Sales Value',
    icon: 'dollar-sign'
  },
  // Note: You'll need to create Customers, Orders, and Payments components
  // {
  //   path: '/sales/customers',
  //   component: CustomersPage, // MISSING - needs to be created
  //   requiredPermissions: ['customers.read'],
  //   title: 'Customers',
  //   icon: 'users'
  // },
  // {
  //   path: '/sales/orders',
  //   component: OrdersPage, // MISSING - needs to be created
  //   requiredPermissions: ['orders.read'],
  //   title: 'Orders',
  //   icon: 'shopping-cart'
  // },
  // {
  //   path: '/sales/payments',
  //   component: PaymentsPage, // MISSING - needs to be created
  //   requiredPermissions: ['payments.read'],
  //   title: 'Payments',
  //   icon: 'credit-card'
  // },

  // POS System Routes
  {
    path: '/pos',
    component:   POSDashboard,
    requiredRoles: ['cashier', 'admin'],
    title: 'POS Dashboard',
    icon: 'monitor'
  },
  {
    path: '/pos/interface',
    component: POSInterface,
    requiredRoles: ['cashier', 'admin'],
    title: 'POS Interface',
    icon: 'shopping-cart'
  },
  {
    path: '/pos/payments',
    component: PaymentProcessing,
    requiredRoles: ['cashier', 'admin'],
    title: 'Payment Processing',
    icon: 'credit-card'
  },

  // Administration Routes
  {
    path: '/admin',
    component: AdminOverview,
    requiredRoles: ['admin'],
    title: 'Admin Overview',
    icon: 'shield'
  },
  {
    path: '/admin/users',
    component: UserManagement,
    requiredPermissions: ['users.read'],
    title: 'User Management',
    icon: 'users'
  },
  {
    path: '/admin/roles',
    component: RolesPermissions,
    requiredPermissions: ['roles.read'],
    title: 'Roles & Permissions',
    icon: 'shield'
  },
  {
    path: '/admin/user-permissions',
    component: UserPermissions,
    requiredPermissions: ['users.read', 'roles.read'],
    title: 'User Permissions',
    icon: 'key'
  },
  {
    path: '/admin/active-users',
    component: AdminActiveUsers,
    requiredRoles: ['admin'],
    title: 'Active Users',
    icon: 'user-check'
  },
  {
    path: '/admin/user-activity',
    component: AdminUserActivity,
    requiredRoles: ['admin'],
    title: 'User Activity',
    icon: 'clock'
  },

  // HR Management Routes
  {
    path: '/hr',
    component: HRDashboard,
    requiredRoles: ['hr_manager', 'admin'],
    title: 'HR Dashboard',
    icon: 'users'
  },
  {
    path: '/hr/add-staff',
    component: AddStaff,
    requiredRoles: ['hr_manager', 'admin'],
    title: 'Add Staff',
    icon: 'user-plus'
  },
  {
    path: '/hr/attendance',
    component: AttendanceDashboard,
    requiredRoles: ['hr_manager', 'admin'],
    title: 'Attendance',
    icon: 'clock'
  },
  {
    path: '/hr/leave-management',
    component: LeaveManagement,
    requiredRoles: ['hr_manager', 'admin'],
    title: 'Leave Management',
    icon: 'calendar'
  },
  {
    path: '/hr/payroll',
    component: PayrollCompensation,
    requiredRoles: ['hr_manager', 'admin'],
    title: 'Payroll & Compensation',
    icon: 'dollar-sign'
  },

  // Marketing Routes
  {
    path: '/marketing',
    component: MarketingDashboard,
    requiredPermissions: ['campaigns.read'],
    title: 'Marketing Dashboard',
    icon: 'megaphone'
  },
  {
    path: '/marketing/campaigns',
    component: CampaignManagement,
    requiredPermissions: ['campaigns.read'],
    title: 'Campaign Management',
    icon: 'megaphone'
  },
  {
    path: '/marketing/analytics',
    component: CampaignAnalytics,
    requiredPermissions: ['campaigns.read'],
    title: 'Campaign Analytics',
    icon: 'bar-chart'
  },
  {
    path: '/marketing/templates',
    component: TemplateManagement,
    requiredPermissions: ['campaigns.read'],
    title: 'Template Management',
    icon: 'file-text'
  },
  {
    path: '/marketing/notifications',
    component: ClientNotifications,
    requiredPermissions: ['campaigns.read'],
    title: 'Client Notifications',
    icon: 'bell'
  },

  // Reports & Analytics Routes
  {
    path: '/reports',
    component: ReportsDashboard,
    requiredPermissions: ['reports.sales', 'reports.inventory', 'reports.financial'],
    title: 'Reports Overview',
    icon: 'file-text'
  },
  {
    path: '/reports/analytics',
    component: ReportsAnalytics,
    requiredPermissions: ['reports.sales', 'reports.inventory', 'reports.financial'],
    title: 'Reports Analytics',
    icon: 'bar-chart'
  },
  {
    path: '/reports/events',
    component: EventCenter,
    requiredPermissions: ['reports.sales', 'reports.inventory', 'reports.financial'],
    title: 'Event Center',
    icon: 'calendar'
  },
  {
    path: '/reports/exports',
    component: Exports,
    requiredPermissions: ['reports.sales', 'reports.inventory', 'reports.financial'],
    title: 'Export Reports',
    icon: 'download'
  },
  // Note: You can add more specific report routes if needed
  // {
  //   path: '/reports/sales',
  //   component: SalesReports, // Could use ProductSalesReport or create new
  //   requiredPermissions: ['reports.sales'],
  //   title: 'Sales Reports',
  //   icon: 'trending-up'
  // },
  // {
  //   path: '/reports/inventory',
  //   component: InventoryReports, // Could use InventorySummary or create new
  //   requiredPermissions: ['reports.inventory'],
  //   title: 'Inventory Reports',
  //   icon: 'package'
  // },
  // {
  //   path: '/reports/financial',
  //   component: FinancialReports, // MISSING - needs to be created
  //   requiredPermissions: ['reports.financial'],
  //   title: 'Financial Reports',
  //   icon: 'dollar-sign'
  // },

  // Note: Branch Management - you don't seem to have this yet
  // {
  //   path: '/branches',
  //   component: BranchManagement, // MISSING - needs to be created
  //   requiredPermissions: ['branches.read'],
  //   title: 'Branch Management',
  //   icon: 'building'
  // },

  // System Settings
  {
    path: '/settings',
    component: SharedSettings,
    requiredPermissions: ['settings.read'],
    title: 'Settings',
    icon: 'settings'
  }
];

// Unauthorized route (no protection needed)
export const unauthorizedRoute = {
  path: '/unauthorized',
  component: UnauthorizedPage,
  title: 'Access Denied',
  icon: 'shield'
};