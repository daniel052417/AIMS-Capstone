import React, { useEffect, useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';
// TODO: Replace with actual API calls when backend is connected
// import { supabase } from '../../lib/supabase';

type ProductMetric = {
  id: string;
  name: string;
  category: string;
  sales: number;
  units: number;
  growthPct: number;
  isPositive: boolean;
  color: string;
};

const COLORS = ['bg-red-500', 'bg-green-500', 'bg-orange-500', 'bg-blue-500', 'bg-yellow-500', 'bg-purple-500'];

function formatCurrencyPHP(value: number): string {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(value);
}

const SalesByProduct: React.FC = () => {
  const [metrics, setMetrics] = useState<ProductMetric[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const totalSales = useMemo(() => metrics.reduce((sum, p) => sum + p.sales, 0), [metrics]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // TODO: Replace with actual API calls when backend is connected
        // For now, use static data
        setTimeout(() => {
          const mockMetrics: ProductMetric[] = [
            {
              id: '1',
              name: 'Premium Chicken Feed',
              category: 'Feeds',
              sales: 125000,
              units: 450,
              growthPct: 18.5,
              isPositive: true,
              color: 'bg-red-500'
            },
            {
              id: '2',
              name: 'Antibiotic Solution',
              category: 'Medicine',
              sales: 89000,
              units: 320,
              growthPct: 12.3,
              isPositive: true,
              color: 'bg-green-500'
            },
            {
              id: '3',
              name: 'Garden Tools Set',
              category: 'Tools',
              sales: 67000,
              units: 180,
              growthPct: -5.2,
              isPositive: false,
              color: 'bg-orange-500'
            },
            {
              id: '4',
              name: 'Vitamin Supplements',
              category: 'Supplements',
              sales: 45000,
              units: 250,
              growthPct: 8.7,
              isPositive: true,
              color: 'bg-blue-500'
            },
            {
              id: '5',
              name: 'Fertilizer Mix',
              category: 'Agriculture',
              sales: 38000,
              units: 95,
              growthPct: 15.1,
              isPositive: true,
              color: 'bg-yellow-500'
            }
          ];
          
          setMetrics(mockMetrics);
          setLoading(false);
        }, 1000);
      } catch (e: any) {
        console.error('Failed to load sales by product', e);
        setError('Failed to load sales by product');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Top Selling Products</h3>
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
          {metrics.map((product) => (
            <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${product.color}`}></div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{product.name}</h4>
                    <p className="text-xs text-gray-500">{product.category} • {product.units} units sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{formatCurrencyPHP(product.sales)}</p>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className={`w-3 h-3 ${product.isPositive ? 'text-green-600' : 'text-red-600 rotate-180'}`} />
                    <span className={`text-xs ${product.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {`${product.growthPct >= 0 ? '+' : ''}${product.growthPct.toFixed(1)}%`}
                    </span>
                  </div>
                </div>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${product.color}`}
                  style={{ width: `${totalSales > 0 ? (product.sales / totalSales) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">Best Seller</p>
            <p className="text-lg font-bold text-green-600">{metrics[0]?.name || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Fastest Growing</p>
            <p className="text-lg font-bold text-blue-600">{metrics.length ? `${metrics.slice().sort((a,b)=> b.growthPct - a.growthPct)[0].growthPct.toFixed(1)}%` : '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesByProduct;