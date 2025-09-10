import React, { useEffect, useState } from 'react';
import { AlertTriangle, Package, TrendingDown } from 'lucide-react';
// TODO: Replace with actual API calls when backend is connected

type LowStockItem = {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minimumStock: number;
  unit: string;
  lastUpdated: string;
  priority: 'high' | 'medium' | 'low';
};

const LowStockAlert: React.FC = () => {
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // TODO: Replace with actual API calls when backend is connected
    // For now, use static data
    setTimeout(() => {
      const mockItems: LowStockItem[] = [
        {
          id: '1',
          name: 'Premium Chicken Feed',
          category: 'Feeds',
          currentStock: 5,
          minimumStock: 20,
          unit: 'bags',
          lastUpdated: '2 hours ago',
          priority: 'high'
        },
        {
          id: '2',
          name: 'Antibiotic Solution',
          category: 'Medicine',
          currentStock: 8,
          minimumStock: 15,
          unit: 'bottles',
          lastUpdated: '1 hour ago',
          priority: 'high'
        },
        {
          id: '3',
          name: 'Garden Tools Set',
          category: 'Tools',
          currentStock: 12,
          minimumStock: 25,
          unit: 'sets',
          lastUpdated: '3 hours ago',
          priority: 'medium'
        },
        {
          id: '4',
          name: 'Vitamin Supplements',
          category: 'Supplements',
          currentStock: 18,
          minimumStock: 30,
          unit: 'bottles',
          lastUpdated: '4 hours ago',
          priority: 'medium'
        },
        {
          id: '5',
          name: 'Fertilizer Mix',
          category: 'Agriculture',
          currentStock: 22,
          minimumStock: 40,
          unit: 'kg',
          lastUpdated: '5 hours ago',
          priority: 'low'
        }
      ];
      
      setItems(mockItems);
      setLoading(false);
    }, 1000);
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      case 'medium':
        return <TrendingDown className="w-4 h-4" />;
      case 'low':
        return <Package className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getStockPercentage = (current: number, minimum: number) => {
    return Math.min((current / minimum) * 100, 100);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Low Stock Alerts</h3>
        <div className="flex items-center space-x-1 text-sm text-gray-600">
          <AlertTriangle className="w-4 h-4" />
          <span>{items.length} items</span>
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
          {items.map((item) => (
            <div key={item.id} className={`p-4 rounded-lg border ${getPriorityColor(item.priority)}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getPriorityIcon(item.priority)}
                  <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                </div>
                <span className="text-xs font-semibold uppercase">{item.priority}</span>
              </div>
              
              <div className="mb-3">
                <p className="text-xs text-gray-600 mb-1">{item.category}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    {item.currentStock} {item.unit} remaining
                  </span>
                  <span className="text-gray-500">
                    Min: {item.minimumStock} {item.unit}
                  </span>
                </div>
              </div>

              <div className="mb-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      item.priority === 'high' ? 'bg-red-500' : 
                      item.priority === 'medium' ? 'bg-orange-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${getStockPercentage(item.currentStock, item.minimumStock)}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Updated {item.lastUpdated}</span>
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  Reorder
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200 text-center">
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View All Alerts
        </button>
      </div>
    </div>
  );
};

export default LowStockAlert;