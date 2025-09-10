import React, { useEffect, useMemo, useState } from 'react';
import { Package, AlertTriangle, CheckCircle } from 'lucide-react';
// TODO: Replace with actual API calls when backend is connected
// import { supabase } from '../../lib/supabase';

type ProductRow = {
  category_id: string;
  stock_quantity: number;
  unit_price: number;
  cost_price: number;
  minimum_stock: number;
};

type CategoryRow = {
  id: string;
  name: string;
};

type CategorySummary = {
  name: string;
  stock: number;
  value: number;
  color: string;
};

const COLORS = ['bg-red-500', 'bg-green-500', 'bg-orange-500', 'bg-blue-500', 'bg-purple-500', 'bg-teal-500'];

function formatCurrencyPHP(value: number): string {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(value);
}

const InventorySummary: React.FC = () => {
  const [categorySummaries, setCategorySummaries] = useState<CategorySummary[]>([]);
  const [inStockQuantity, setInStockQuantity] = useState<number>(0);
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [outOfStockCount, setOutOfStockCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // TODO: Replace with actual API calls when backend is connected
        // For now, use static data
        setTimeout(() => {
          const mockCategorySummaries: CategorySummary[] = [
            { name: 'Feeds', stock: 450, value: 125000, color: 'bg-red-500' },
            { name: 'Medicine', stock: 320, value: 89000, color: 'bg-green-500' },
            { name: 'Agriculture Tools', stock: 180, value: 67000, color: 'bg-orange-500' },
            { name: 'Supplements', stock: 250, value: 45000, color: 'bg-blue-500' },
            { name: 'Equipment', stock: 95, value: 38000, color: 'bg-purple-500' },
            { name: 'Accessories', stock: 120, value: 22000, color: 'bg-teal-500' },
          ];
          
          setCategorySummaries(mockCategorySummaries);
          setInStockQuantity(1415);
          setLowStockCount(12);
          setOutOfStockCount(3);
          setLoading(false);
        }, 1000);
      } catch (err: any) {
        console.error('Failed to load inventory summary', err);
        setError('Failed to load inventory summary');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalValue = useMemo(() => categorySummaries.reduce((sum, c) => sum + c.value, 0), [categorySummaries]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Inventory Summary</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Package className="w-4 h-4" />
          <span>Total Value: {formatCurrencyPHP(totalValue)}</span>
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          <div className="h-14 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-14 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-14 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      )}

      {error && !loading && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {!loading && !error && (
        <div className="space-y-4">
          {categorySummaries.map((category, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{category.name}</p>
                  <p className="text-xs text-gray-500">{category.stock} items</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{formatCurrencyPHP(category.value)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center space-x-1 text-green-600 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">In Stock</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{inStockQuantity.toLocaleString()}</p>
          </div>
          <div>
            <div className="flex items-center justify-center space-x-1 text-orange-600 mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Low Stock</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{lowStockCount.toLocaleString()}</p>
          </div>
          <div>
            <div className="flex items-center justify-center space-x-1 text-red-600 mb-1">
              <Package className="w-4 h-4" />
              <span className="text-sm font-medium">Out of Stock</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{outOfStockCount.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventorySummary;