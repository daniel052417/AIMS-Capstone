import React from 'react';
import DynamicPermissionSidebar from './DynamicPermissionSidebar';
import Header from './layouts/Header';
import { type UserProfile } from '../lib/supabase';

interface MainLayoutProps {
  children: React.ReactNode;
  user: UserProfile;
  onLogout: () => void;
  className?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  user,
  onLogout,
  className = '' 
}) => {
  return (
    <div className={`flex h-screen bg-gray-100 ${className}`}>
      {/* Dynamic Permission-based Sidebar */}
      <DynamicPermissionSidebar 
        user={user} 
        onLogout={onLogout}
        className="bg-white shadow-lg border-r border-gray-200" 
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Optional, you can remove this if the sidebar handles user info */}
        <Header user={user} onLogout={onLogout} />
        
        {/* Page Content - This is where permission checks happen */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;