import React, { useEffect, useMemo, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
// TODO: Replace with actual API calls when backend is connected
// import { supabase } from '../../lib/supabase';

interface MetricCardProps {
  title: string;
  value?: string;
  change?: string;
  isPositive?: boolean;
  color: 'green' | 'blue' | 'orange' | 'purple';
  metricType?: 'todays_sales' | 'products_in_stock' | 'active_orders' | 'low_stock_alerts';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, isPositive, color, metricType }) => {
  const colorClasses = {
    green: {
      bg: 'bg-white',
      accent: 'bg-green-500',
      text: 'text-green-600',
      lightBg: 'bg-green-50'
    },
    blue: {
      bg: 'bg-white',
      accent: 'bg-blue-500',
      text: 'text-blue-600',
      lightBg: 'bg-blue-50'
    },
    orange: {
      bg: 'bg-white',
      accent: 'bg-orange-500',
      text: 'text-orange-600',
      lightBg: 'bg-orange-50'
    },
    purple: {
      bg: 'bg-white',
      accent: 'bg-purple-500',
      text: 'text-purple-600',
      lightBg: 'bg-purple-50'
    },
  };

  const colors = colorClasses[color];

  const [computedValue, setComputedValue] = useState<string | undefined>(value);
  const [computedChange, setComputedChange] = useState<string | undefined>(change);
  const [computedIsPositive, setComputedIsPositive] = useState<boolean | undefined>(isPositive);
  const [loading, setLoading] = useState<boolean>(Boolean(metricType));
  const [error, setError] = useState<string | null>(null);

  const numberFormatter = useMemo(() => new Intl.NumberFormat('en-PH'), []);
  const currencyFormatter = useMemo(() => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }), []);

  useEffect(() => {
    if (!metricType) return;

    async function fetchMetrics() {
      setLoading(true);
      setError(null);
      try {
        // TODO: Replace with actual API calls when backend is connected
        // For now, use static data
        if (metricType === 'todays_sales') {
          setComputedValue(currencyFormatter.format(125430));
          setComputedIsPositive(true);
          setComputedChange('+12.5%');
        }

        if (metricType === 'products_in_stock') {
          setComputedValue(numberFormatter.format(1247));
          setComputedChange(undefined);
          setComputedIsPositive(undefined);
        }

        if (metricType === 'active_orders') {
          setComputedValue(numberFormatter.format(23));
          setComputedChange(undefined);
          setComputedIsPositive(undefined);
        }

        if (metricType === 'low_stock_alerts') {
          setComputedValue(numberFormatter.format(12));
          setComputedChange(undefined);
          setComputedIsPositive(undefined);
        }
      } catch (e: any) {
        console.error('Failed to load metric', e);
        setError('Failed to load');
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, [metricType, currencyFormatter, numberFormatter]);

  return (
    <div className={`${colors.bg} rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${colors.lightBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <div className={`w-6 h-6 ${colors.accent} rounded-lg`}></div>
        </div>
        {(computedChange !== undefined && computedIsPositive !== undefined) && (
          <div className="flex items-center space-x-1">
            {computedIsPositive ? (
              <TrendingUp className={`w-4 h-4 ${colors.text}`} />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm font-semibold ${computedIsPositive ? colors.text : 'text-red-500'}`}>
              {computedChange}
            </span>
          </div>
        )}
      </div>
      <div>
        <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
        {loading ? (
          <div className="h-6 bg-gray-100 rounded-md animate-pulse w-24" />
        ) : error ? (
          <h3 className="text-sm font-medium text-red-600">{error}</h3>
        ) : (
          <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{computedValue ?? value}</h3>
        )}
      </div>
      <div className={`w-full h-1 ${colors.accent} rounded-full mt-4 opacity-20 group-hover:opacity-40 transition-opacity duration-300`}></div>
    </div>
  );
};

export default MetricCard;