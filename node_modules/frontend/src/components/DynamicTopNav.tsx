import React from 'react';
import { useAccess } from '../hooks/usePermission';
import { Bell, Settings, User, LogOut } from 'lucide-react';

interface DynamicTopNavProps {
  onLogout: () => void;
  onProfileClick: () => void;
  onSettingsClick: () => void;
  onNotificationsClick: () => void;
}

export const DynamicTopNav: React.FC<DynamicTopNavProps> = ({
  onLogout,
  onProfileClick,
  onSettingsClick,
  onNotificationsClick
}) => {
  const { canAccess: canViewSettings } = useAccess(['settings.read'], ['admin']);
  const { canAccess: canViewNotifications } = useAccess(['notifications.read']);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-800">AIMS</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {canViewNotifications && (
            <button
              onClick={onNotificationsClick}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
            >
              <Bell className="w-5 h-5" />
            </button>
          )}
          
          {canViewSettings && (
            <button
              onClick={onSettingsClick}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
          
          <button
            onClick={onProfileClick}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
          >
            <User className="w-5 h-5" />
          </button>
          
          <button
            onClick={onLogout}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
};