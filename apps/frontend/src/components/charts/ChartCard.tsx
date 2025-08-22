import React from 'react';
import { LoadingSpinner } from '@/components/common';

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  loading?: boolean;
  error?: string | null;
  children: React.ReactNode;
  actions?: React.ReactNode;
  height?: string | number;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  loading = false,
  error,
  children,
  actions,
  height = 300,
  className = ''
}) => {
  return (
    <div className={`card ${className}`}>
      {/* Header */}
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="card-body">
        <div 
          style={{ height: typeof height === 'number' ? `${height}px` : height }}
          className="relative"
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
              <LoadingSpinner text="載入圖表資料..." />
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-red-600 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-gray-600 text-sm">載入圖表資料失敗</p>
                <p className="text-gray-500 text-xs mt-1">{error}</p>
              </div>
            </div>
          )}
          
          {!loading && !error && children}
        </div>
      </div>
    </div>
  );
};