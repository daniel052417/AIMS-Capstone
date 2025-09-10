import React, { useEffect, useMemo, useState } from 'react';
import { MapPin, TrendingUp, Users } from 'lucide-react';
// TODO: Replace with actual API calls when backend is connected
// import { supabase } from '../../lib/supabase';

type BranchRow = {
  id: string;
  name: string;
};

type TxRow = {
  id: string;
  branch_id: string;
  customer_id: string | null;
  total_amount: number;
  transaction_date: string;
};

type BranchMetric = {
  id: string;
  name: string;
  sales: number;
  orders: number;
  customers: number;
  growthPct: number;
  isPositive: boolean;
  color: string;
};

const COLORS = ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-teal-500', 'bg-pink-500'];

function formatCurrencyPHP(value: number): string {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(value);
}

const SalesByBranch: React.FC = () => {
  const [metrics, setMetrics] = useState<BranchMetric[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const totalSales = useMemo(() => metrics.reduce((sum, b) => sum + b.sales, 0), [metrics]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // TODO: Replace with actual API calls when backend is connected
        // For now, use static data
        setTimeout(() => {
          const mockMetrics: BranchMetric[] = [
            {
              id: '1',
              name: 'Main Branch',
              sales: 450000,
              orders: 125,
              customers: 89,
              growthPct: 15.2,
              isPositive: true,
              color: 'bg-green-500'
            },
            {
              id: '2',
              name: 'Downtown Branch',
              sales: 320000,
              orders: 98,
              customers: 67,
              growthPct: 8.7,
              isPositive: true,
              color: 'bg-blue-500'
            },
            {
              id: '3',
              name: 'Mall Branch',
              sales: 280000,
              orders: 76,
              customers: 54,
              growthPct: -2.1,
              isPositive: false,
              color: 'bg-purple-500'
            },
            {
              id: '4',
              name: 'Suburban Branch',
              sales: 195000,
              orders: 45,
              customers: 32,
              growthPct: 12.3,
              isPositive: true,
              color: 'bg-orange-500'
            }
          ];
          
          setMetrics(mockMetrics);
          setLoading(false);
        }, 1000);
      } catch (e: any) {
        console.error('Failed to load sales by branch', e);
        setError('Failed to load sales by branch');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Sales by Branch</h3>
        <div className="text-sm text-gray-600">
          Total: {formatCurrencyPHP(totalSales)}
        </div>
      </div>

      {loading && (
        <div className="space-y-4">
          <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      )}

      {error && !loading && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {!loading && !error && (
        <div className="space-y-4">
          {metrics.map((branch) => (
            <div key={branch.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${branch.color}`}></div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{branch.name}</h4>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" />
                        <span>{branch.orders} orders</span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Users className="w-3 h-3" />
                        <span>{branch.customers} customers</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{formatCurrencyPHP(branch.sales)}</p>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className={`w-3 h-3 ${branch.isPositive ? 'text-green-600' : 'text-red-600 rotate-180'}`} />
                    <span className={`text-xs ${branch.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {`${branch.growthPct >= 0 ? '+' : ''}${branch.growthPct.toFixed(1)}%`}
                    </span>
                  </div>
                </div>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${branch.color}`}
                  style={{ width: `${totalSales > 0 ? (branch.sales / totalSales) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">Best Performing</p>
            <p className="text-lg font-bold text-green-600">{metrics[0]?.name || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Growth Leader</p>
            <p className="text-lg font-bold text-blue-600">{metrics.length ? `${metrics.slice().sort((a,b)=> b.growthPct - a.growthPct)[0].growthPct.toFixed(1)}%` : '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesByBranch;