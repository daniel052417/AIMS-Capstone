import React, { useEffect, useState } from 'react';
import { Clock, User, Package, DollarSign, AlertCircle } from 'lucide-react';
// TODO: Replace with actual API calls when backend is connected

type Activity = {
  id: string;
  type: 'sale' | 'inventory' | 'user' | 'alert';
  message: string;
  timestamp: string;
  user?: string;
  amount?: number;
  icon: React.ReactNode;
  color: string;
};

const RecentActivity: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // TODO: Replace with actual API calls when backend is connected
    // For now, use static data
    setTimeout(() => {
      const mockActivities: Activity[] = [
        {
          id: '1',
          type: 'sale',
          message: 'New sale completed',
          timestamp: '2 minutes ago',
          user: 'Maria Santos',
          amount: 1250,
          icon: <DollarSign className="w-4 h-4" />,
          color: 'text-green-600 bg-green-50'
        },
        {
          id: '2',
          type: 'inventory',
          message: 'Low stock alert triggered',
          timestamp: '15 minutes ago',
          icon: <AlertCircle className="w-4 h-4" />,
          color: 'text-orange-600 bg-orange-50'
        },
        {
          id: '3',
          type: 'user',
          message: 'New staff member added',
          timestamp: '1 hour ago',
          user: 'Admin',
          icon: <User className="w-4 h-4" />,
          color: 'text-blue-600 bg-blue-50'
        },
        {
          id: '4',
          type: 'sale',
          message: 'Large order processed',
          timestamp: '2 hours ago',
          user: 'Juan Dela Cruz',
          amount: 5500,
          icon: <Package className="w-4 h-4" />,
          color: 'text-purple-600 bg-purple-50'
        },
        {
          id: '5',
          type: 'inventory',
          message: 'Stock updated for Premium Feed',
          timestamp: '3 hours ago',
          user: 'Carlos Mendoza',
          icon: <Package className="w-4 h-4" />,
          color: 'text-teal-600 bg-teal-50'
        },
        {
          id: '6',
          type: 'sale',
          message: 'Payment received',
          timestamp: '4 hours ago',
          user: 'Ana Rodriguez',
          amount: 3200,
          icon: <DollarSign className="w-4 h-4" />,
          color: 'text-green-600 bg-green-50'
        }
      ];
      
      setActivities(mockActivities);
      setLoading(false);
    }, 1000);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(value);
  };

  const formatTime = (timestamp: string) => {
    return timestamp;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
        <div className="flex items-center space-x-1 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>Live Updates</span>
        </div>
      </div>

      {loading && (
        <div className="space-y-4">
          <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      )}

      {!loading && (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full ${activity.color} flex items-center justify-center`}>
                {activity.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{activity.message}</p>
                <div className="flex items-center space-x-2 mt-1">
                  {activity.user && (
                    <span className="text-xs text-gray-500">by {activity.user}</span>
                  )}
                  {activity.amount && (
                    <span className="text-xs font-semibold text-green-600">{formatCurrency(activity.amount)}</span>
                  )}
                  <span className="text-xs text-gray-400">{formatTime(activity.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200 text-center">
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View All Activity
        </button>
      </div>
    </div>
  );
};

export default RecentActivity;