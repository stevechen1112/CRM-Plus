import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface StatsCardProps {
  title: string;
  value: string | number;
  previousValue?: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendPercentage?: number;
  subtitle?: string;
  loading?: boolean;
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  previousValue,
  icon,
  trend,
  trendPercentage,
  subtitle,
  loading = false,
  className = ''
}) => {
  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      }
      if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  const getTrendColor = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'text-success-600';
      case 'down':
        return 'text-error-600';
      default:
        return 'text-gray-500';
    }
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4" />;
      case 'down':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className={`card ${className}`}>
        <div className="card-body animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-32"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card hover:shadow-md transition-shadow ${className}`}>
      <div className="card-body">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          {icon && (
            <div className="p-2 bg-primary-100 rounded-lg">
              <div className="text-primary-600">{icon}</div>
            </div>
          )}
        </div>

        {/* Main Value */}
        <div className="space-y-2">
          <div className="text-2xl font-bold text-gray-900">
            {formatValue(value)}
          </div>

          {/* Trend and Subtitle */}
          <div className="flex items-center justify-between">
            {(trend || trendPercentage !== undefined) && (
              <div className={`flex items-center space-x-1 ${getTrendColor(trend)}`}>
                {getTrendIcon(trend)}
                {trendPercentage !== undefined && (
                  <span className="text-sm font-medium">
                    {trendPercentage > 0 ? '+' : ''}{trendPercentage.toFixed(1)}%
                  </span>
                )}
              </div>
            )}

            {subtitle && (
              <span className="text-xs text-gray-500">{subtitle}</span>
            )}
          </div>

          {previousValue && (
            <div className="text-xs text-gray-400">
              前期: {formatValue(previousValue)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};