import React, { useEffect, useState } from 'react';
import { Trophy, Star, TrendingUp } from 'lucide-react';
// TODO: Replace with actual API calls when backend is connected

type Performer = {
  id: string;
  name: string;
  role: string;
  sales: number;
  growth: number;
  avatar?: string;
  rank: number;
};

const TopPerformers: React.FC = () => {
  const [performers, setPerformers] = useState<Performer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // TODO: Replace with actual API calls when backend is connected
    // For now, use static data
    setTimeout(() => {
      const mockPerformers: Performer[] = [
        {
          id: '1',
          name: 'Maria Santos',
          role: 'Sales Manager',
          sales: 125000,
          growth: 18.5,
          rank: 1
        },
        {
          id: '2',
          name: 'Juan Dela Cruz',
          role: 'Sales Representative',
          sales: 98000,
          growth: 15.2,
          rank: 2
        },
        {
          id: '3',
          name: 'Ana Rodriguez',
          role: 'Sales Representative',
          sales: 87000,
          growth: 12.8,
          rank: 3
        },
        {
          id: '4',
          name: 'Carlos Mendoza',
          role: 'Sales Representative',
          sales: 76000,
          growth: 9.3,
          rank: 4
        },
        {
          id: '5',
          name: 'Elena Garcia',
          role: 'Sales Representative',
          sales: 65000,
          growth: 7.1,
          rank: 5
        }
      ];
      
      setPerformers(mockPerformers);
      setLoading(false);
    }, 1000);
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Star className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Star className="w-5 h-5 text-orange-500" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-500">{rank}</span>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Top Performers</h3>
        <div className="flex items-center space-x-1 text-sm text-gray-600">
          <TrendingUp className="w-4 h-4" />
          <span>This Month</span>
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
        <div className="space-y-4">
          {performers.map((performer) => (
            <div key={performer.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8">
                  {getRankIcon(performer.rank)}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{performer.name}</h4>
                  <p className="text-xs text-gray-500">{performer.role}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{formatCurrency(performer.sales)}</p>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-600">+{performer.growth.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-green-600">+{performers.reduce((sum, p) => sum + p.growth, 0) / performers.length || 0}</span> average growth
        </p>
      </div>
    </div>
  );
};

export default TopPerformers;