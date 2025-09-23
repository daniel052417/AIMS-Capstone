import { lazy, type ComponentType } from 'react';
import type { RouteComponentProps } from '../App';

// Import shared pages (multi-role access)
const Dashboard = lazy(() => import('../pages/shared/Dashboard'));
const UserManagement = lazy(() => import('../pages/admin/UserAccounts'));
const RolesPermissions = lazy(() => import('../pages/shared/RolesPermissions'));
const UserPermissions = lazy(() => import('../pages/shared/UserPermissions'));
const SharedInventoryManagement = lazy(() => import('../pages/shared/InventoryManagement'));
const SharedSalesDashboard = lazy(() => import('../pages/shared/SalesDashboard'));
const SharedMarketingDashboard = lazy(() => import('../pages/shared/MarketingDashboard'));
const SharedReportsAnalytics = lazy(() => import('../pages/shared/ReportsAnalytics'));
const SharedSettings = lazy(() => import('../pages/shared/Settings'));
const Claims = lazy(() => import('../pages/shared/Claims'));

// Import admin pages
const AdminOverview = lazy(() => import('../pages/admin/Overview'));
const AdminSettings = lazy(() => import('../pages/admin/Settings'));
const AdminActiveUsers = lazy(() => import('../pages/admin/ActiveUsers'));
const AdminUserActivity = lazy(() => import('../pages/admin/UserActivity'));

// Import inventory pages
const InventorySummary = lazy(() => import('../pages/inventory/InventorySummaryPage'));
const Categories = lazy(() => import('../pages/inventory/Categories'));
const LowStockAlerts = lazy(() => import('../pages/inventory/LowStockAlerts'));
const InventoryManagement = lazy(() => import('../pages/inventory/InventoryManagement'));

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
const AgrivetProductHandler = lazy(() => import('../pages/pos/cashier/AgrivetProductHandler'));
const CustomerLookup = lazy(() => import('../pages/pos/cashier/CustomerLookup'));
const POSHeader = lazy(() => import('../pages/pos/cashier/POSHeader'));
const ProductSearch = lazy(() => import('../pages/pos/cashier/ProductSearch'));
const QuickSaleShortcuts = lazy(() => import('../pages/pos/cashier/QuickSaleShortcuts'));
const ReceiptGenerator = lazy(() => import('../pages/pos/cashier/ReceiptGenerator'));
const ShoppingCart = lazy(() => import('../pages/pos/cashier/ShoppingCart'));

// Import marketing pages
const MarketingDashboard = lazy(() => import('../pages/marketing/MarketingDashboard'));
const CampaignManagement = lazy(() => import('../pages/marketing/CampaignManagement'));
const CampaignAnalytics = lazy(() => import('../pages/marketing/CampaignAnalytics'));
const CampaignForm = lazy(() => import('../pages/marketing/CampaignForm'));
const CampaignPreview = lazy(() => import('../pages/marketing/CampaignPreview'));
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
const AttendanceTimesheet = lazy(() => import('../pages/hr/AttendanceTimesheet'));
const HRAnalytics = lazy(() => import('../pages/hr/HRAnalytics'));
const LeaveManagement = lazy(() => import('../pages/hr/LeaveManagement'));
const LeaveRequest = lazy(() => import('../pages/hr/LeaveRequest'));
const PayrollCompensation = lazy(() => import('../pages/hr/PayrollCompensation'));
const Performance = lazy(() => import('../pages/hr/Performance'));
const Training = lazy(() => import('../pages/hr/Training'));

// Unauthorized page
const UnauthorizedPage = lazy(() => import('../pages/UnauthorizedPage'));

export interface RouteConfig {
    path: string;
    component?: ComponentType<any>;
    requiredPermissions?: string[];
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
    component: SharedInventoryManagement,
    requiredPermissions: ['inventory.read'],
    title: 'Inventory Overview',
    icon: 'package'
  },
  {
    path: '/inventory/management',
    component: InventoryManagement,
    requiredPermissions: ['inventory.read'],
    title: 'Inventory Management',
    icon: 'warehouse'
  },
  {
    path: '/inventory/summary',
    component: InventorySummary,
    requiredPermissions: ['products.read'],
    title: 'Inventory Summary',
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

  // Sales Routes
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

  // POS System Routes
  {
    path: '/pos',
    component: POSDashboard,
    requiredPermissions: ['pos.access'],
    title: 'POS Dashboard',
    icon: 'monitor'
  },
  {
    path: '/pos/interface',
    component: POSInterface,
    requiredPermissions: ['pos.access'],
    title: 'POS Interface',
    icon: 'shopping-cart'
  },
  {
    path: '/pos/payments',
    component: PaymentProcessing,
    requiredPermissions: ['pos.access'],
    title: 'Payment Processing',
    icon: 'credit-card'
  },
  {
    path: '/pos/product-handler',
    component: AgrivetProductHandler,
    requiredPermissions: ['pos.access'],
    title: 'Product Handler',
    icon: 'package'
  },
  {
    path: '/pos/customer-lookup',
    component: CustomerLookup,
    requiredPermissions: ['pos.access'],
    title: 'Customer Lookup',
    icon: 'users'
  },
  {
    path: '/pos/header',
    component: POSHeader,
    requiredPermissions: ['pos.access'],
    title: 'POS Header',
    icon: 'layout'
  },
  {
    path: '/pos/product-search',
    component: ProductSearch,
    requiredPermissions: ['pos.access'],
    title: 'Product Search',
    icon: 'search'
  },
  {
    path: '/pos/shortcuts',
    component: QuickSaleShortcuts,
    requiredPermissions: ['pos.access'],
    title: 'Quick Sale Shortcuts',
    icon: 'zap'
  },
  {
    path: '/pos/receipt',
    component: ReceiptGenerator,
    requiredPermissions: ['pos.access'],
    title: 'Receipt Generator',
    icon: 'printer'
  },
  {
    path: '/pos/cart',
    component: ShoppingCart,
    requiredPermissions: ['pos.access'],
    title: 'Shopping Cart',
    icon: 'shopping-bag'
  },

  // Administration Routes
  {
    path: '/admin',
    component: AdminOverview,
    requiredPermissions: ['admin.overview'],
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
    requiredPermissions: ['admin.active_users'],
    title: 'Active Users',
    icon: 'user-check'
  },
  {
    path: '/admin/user-activity',
    component: AdminUserActivity,
    requiredPermissions: ['admin.user_activity'],
    title: 'User Activity',
    icon: 'clock'
  },
  {
    path: '/admin/settings',
    component: AdminSettings,
    requiredPermissions: ['admin.settings'],
    title: 'Admin Settings',
    icon: 'settings'
  },

  // HR Management Routes
  {
    path: '/hr',
    component: HRDashboard,
    requiredPermissions: ['hr.staff_read'],
    title: 'HR Dashboard',
    icon: 'users'
  },
  {
    path: '/hr/add-staff',
    component: AddStaff,
    requiredPermissions: ['hr.staff_create'],
    title: 'Add Staff',
    icon: 'user-plus'
  },
  {
    path: '/hr/attendance',
    component: AttendanceDashboard,
    requiredPermissions: ['hr.attendance_read'],
    title: 'Attendance Dashboard',
    icon: 'clock'
  },
  {
    path: '/hr/timesheet',
    component: AttendanceTimesheet,
    requiredPermissions: ['hr.timesheet_manage'],
    title: 'Attendance Timesheet',
    icon: 'file-text'
  },
  {
    path: '/hr/analytics',
    component: HRAnalytics,
    requiredPermissions: ['hr.analytics'],
    title: 'HR Analytics',
    icon: 'bar-chart'
  },
  {
    path: '/hr/leave-management',
    component: LeaveManagement,
    requiredPermissions: ['hr.leave_requests'],
    title: 'Leave Management',
    icon: 'calendar'
  },
  {
    path: '/hr/leave-request',
    component: LeaveRequest,
    requiredPermissions: ['hr.leave_create'],
    title: 'Leave Request',
    icon: 'calendar-plus'
  },
  {
    path: '/hr/payroll',
    component: PayrollCompensation,
    requiredPermissions: ['hr.payroll_read'],
    title: 'Payroll & Compensation',
    icon: 'dollar-sign'
  },
  {
    path: '/hr/performance',
    component: Performance,
    requiredPermissions: ['hr.performance_read'],
    title: 'Performance Management',
    icon: 'trending-up'
  },
  {
    path: '/hr/training',
    component: Training,
    requiredPermissions: ['hr.training_read'],
    title: 'Training Management',
    icon: 'book-open'
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
    requiredPermissions: ['campaigns.analytics'],
    title: 'Campaign Analytics',
    icon: 'bar-chart'
  },
  {
    path: '/marketing/form',
    component: CampaignForm,
    requiredPermissions: ['campaigns.create'],
    title: 'Campaign Form',
    icon: 'file-text'
  },
  {
    path: '/marketing/preview',
    component: CampaignPreview,
    requiredPermissions: ['campaigns.read'],
    title: 'Campaign Preview',
    icon: 'eye'
  },
  {
    path: '/marketing/templates',
    component: TemplateManagement,
    requiredPermissions: ['templates.read'],
    title: 'Template Management',
    icon: 'file-text'
  },
  {
    path: '/marketing/notifications',
    component: ClientNotifications,
    requiredPermissions: ['notifications.send'],
    title: 'Client Notifications',
    icon: 'bell'
  },

  // Reports & Analytics Routes
  {
    path: '/reports',
    component: ReportsDashboard,
    requiredPermissions: ['reports.read'],
    title: 'Reports Dashboard',
    icon: 'file-text'
  },
  {
    path: '/reports/analytics',
    component: ReportsAnalytics,
    requiredPermissions: ['reports.analytics'],
    title: 'Reports Analytics',
    icon: 'bar-chart'
  },
  {
    path: '/reports/events',
    component: EventCenter,
    requiredPermissions: ['reports.events'],
    title: 'Event Center',
    icon: 'calendar'
  },
  {
    path: '/reports/exports',
    component: Exports,
    requiredPermissions: ['reports.export'],
    title: 'Export Reports',
    icon: 'download'
  },

  // Claims Management
  {
    path: '/claims',
    component: Claims,
    requiredPermissions: ['claims.read'],
    title: 'Claims Management',
    icon: 'file-text'
  },

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