import React from 'react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
  text?: string;
  overlay?: boolean;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

const colorClasses = {
  primary: 'border-primary-600 border-t-transparent',
  white: 'border-white border-t-transparent',
  gray: 'border-gray-300 border-t-gray-600'
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
  text,
  overlay = false
}) => {
  const spinnerElement = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`
          animate-spin rounded-full border-2 
          ${sizeClasses[size]} 
          ${colorClasses[color]}
        `}
      />
      {text && (
        <p className={`mt-3 text-sm ${
          color === 'white' ? 'text-white' : 'text-gray-600'
        }`}>
          {text}
        </p>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          {spinnerElement}
        </div>
      </div>
    );
  }

  return spinnerElement;
};

// Loading overlay for specific components
export const LoadingOverlay: React.FC<{
  loading: boolean;
  children: React.ReactNode;
  text?: string;
}> = ({ loading, children, text }) => {
  return (
    <div className="relative">
      {children}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <LoadingSpinner text={text} />
        </div>
      )}
    </div>
  );
};

// Progress bar component
export const ProgressBar: React.FC<{
  progress: number;
  showPercentage?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({
  progress,
  showPercentage = true,
  color = 'primary',
  size = 'md',
  className = ''
}) => {
  const heightClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const colorClasses = {
    primary: 'bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500'
  };

  return (
    <div className={`w-full ${className}`}>
      {showPercentage && (
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>進度</span>
          <span>{Math.round(progress)}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${heightClasses[size]}`}>
        <div
          className={`${colorClasses[color]} ${heightClasses[size]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
};