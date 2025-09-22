import { useState } from 'react';
import Overview from '../pages/admin/Overview';
import SalesValue from '../pages/sales/SalesValue';
import AllSalesRecords from '../pages/sales/AllSalesRecords';
import SalesDashboard from '../pages/sales/SalesDashboard';
import DailySalesSummary from '../pages/sales/DailySalesSummary';
import ProductSalesReport from '../pages/sales/ProductSalesReport';
import InventorySummaryPage from '../pages/inventory/InventorySummaryPage';
import InventoryManagement from '../pages/inventory/InventoryManagement';
import AttendanceTimesheet from '../pages/hr/AttendanceTimesheet';
import RolesPermissions from '../pages/admin/RolesPermissions';
import LeaveRequest from '../pages/hr/LeaveRequest';
import MarketingDashboard from '../pages/marketing/MarketingDashboard';
import CampaignManagement from '../pages/marketing/CampaignManagement';
import TemplateManagement from '../pages/marketing/TemplateManagement';
import CampaignAnalytics from '../pages/marketing/CampaignAnalytics';
import ClientNotifications from '../pages/marketing/ClientNotifications';
import EventCenter from '../pages/reports/EventCenter';
import ReportsAnalytics from '../pages/reports/ReportsAnalytics';
import SettingsPage from '../pages/shared/SettingsPage';
import LowStockAlerts from '../pages/inventory/LowStockAlerts';
import Categories from '../pages/inventory/Categories';
import ActiveUsers from '../pages/admin/ActiveUsers';
import UserAccounts from '../pages/admin/UserAccounts';
import UserActivity from '../pages/admin/UserActivity';
import AddStaff from '../pages/hr/AddStaff';
import UserPermissions from '../pages/admin/UserPermissions';
import HRDashboard from '../pages/hr/HRDashboard';
import AttendanceDashboard from '../pages/hr/AttendanceDashboard';
import LeaveManagement from '../pages/hr/LeaveManagement';
import HRAnalytics from '../pages/hr/HRAnalytics';
import PayrollCompensation from '../pages/hr/PayrollCompensation';
import { UserProfile } from '../lib/supabase';

interface AdminDashboardProps {
  user: UserProfile;
  onLogout: () => void;
}

function AdminDashboard({onLogout}: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState('overview');

   const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <Overview />;
      case 'sales-value':
        return <SalesValue />;
      case 'sales-records':
        return <AllSalesRecords />;
      case 'sales-dashboard':
        return <SalesDashboard />;
      case 'daily-sales':
        return <DailySalesSummary />;
      case 'product-sales':
        return <ProductSalesReport />;
      case 'inventory-summary':
        return <InventorySummaryPage />;
      case 'inventory-management':
      case 'all-products':
        return <InventoryManagement />;
      case 'categories':
        return <Categories />;
      case 'feeds':
      case 'medicine':
      case 'agriculture':
      case 'tools':
        return <InventoryManagement />;
      case 'low-stock':
        return <LowStockAlerts />;
      
      // Staff & User Management Section
      case 'staff-user-management':
        return <UserAccounts />;
      case 'user-accounts':
        return <UserAccounts />;
      case 'add-staff':
        return <AddStaff onBack={() => setActiveSection('user-accounts')} />;
      case 'roles-permissions':
        return <RolesPermissions />;
      case 'activity-logs':
        return <UserActivity />;
      
      // Legacy staff management routes (for backward compatibility)
      case 'staff':
      case 'staff-management':
        return <UserAccounts />;
      case 'attendance':
        return <AttendanceTimesheet />;
      case 'leave':
        return <LeaveRequest />;
      case 'marketing':
      case 'marketing-dashboard':
        return <MarketingDashboard />;
      case 'campaigns':
        return <CampaignManagement />;
      case 'templates':
        return <TemplateManagement />;
      case 'analytics':
        return <CampaignAnalytics />;
      case 'notifications':
        return <ClientNotifications />;
      case 'reports':
        return <ReportsAnalytics />;
      case 'event-center':
        return <EventCenter />;
      case 'settings':
        return <SettingsPage />;
      
      // HR Section (Simplified)
      case 'hr':
        return <HRDashboard />;
      case 'hr-dashboard':
        return <HRDashboard />;
      case 'attendance-dashboard':
        return <AttendanceDashboard />;
      case 'leave-management':
        return <LeaveManagement />;
      case 'hr-analytics':
        return <HRAnalytics />;
      case 'attendance-leave':
        return <AttendanceDashboard />;
      case 'payroll':
        return <PayrollCompensation />;
      
      // Legacy HR routes (for backward compatibility)
      case 'hr-dashboard':
        return <HRDashboard />;
      case 'employees':
        return <UserAccounts />;
      case 'performance':
        return (
          <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Performance Management</h2>
              <p className="text-gray-600">Coming soon - Performance tracking and reviews</p>
              <div className="mt-4 inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
                <span className="text-sm">🚧 Under Development</span>
              </div>
            </div>
          </div>
        );
      case 'training':
        return (
          <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Training & Development</h2>
              <p className="text-gray-600">Coming soon - Learning management system</p>
              <div className="mt-4 inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
                <span className="text-sm">🚧 Under Development</span>
              </div>
            </div>
          </div>
        );
      case 'active-users':
        return <ActiveUsers />;
      case 'user-accounts':
        return <UserAccounts />;
      case 'user-activity':
        return <UserActivity />;
      case 'user-permissions':
        return <UserPermissions />;
      default:
        return (
          <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {activeSection.replace('-', ' ').toUpperCase()}
              </h2>
              <p className="text-gray-600">This section is under development.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="p-6">
      {renderContent()}
    </div>
  );
}

export default AdminDashboard;

