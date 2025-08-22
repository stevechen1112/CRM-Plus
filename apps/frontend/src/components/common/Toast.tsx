import React, { createContext, useContext, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  autoClose?: boolean;
}

interface ToastContextType {
  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  hideToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const typeConfig = {
  success: {
    icon: CheckCircle,
    iconClass: 'text-success-600',
    bgClass: 'bg-success-50 border-success-200',
    titleClass: 'text-success-800'
  },
  error: {
    icon: XCircle,
    iconClass: 'text-error-600',
    bgClass: 'bg-error-50 border-error-200',
    titleClass: 'text-error-800'
  },
  warning: {
    icon: AlertCircle,
    iconClass: 'text-warning-600',
    bgClass: 'bg-warning-50 border-warning-200',
    titleClass: 'text-warning-800'
  },
  info: {
    icon: Info,
    iconClass: 'text-primary-600',
    bgClass: 'bg-primary-50 border-primary-200',
    titleClass: 'text-primary-800'
  }
};

const ToastItem: React.FC<{ 
  toast: ToastMessage; 
  onClose: (id: string) => void;
}> = ({ toast, onClose }) => {
  const config = typeConfig[toast.type];
  const IconComponent = config.icon;

  React.useEffect(() => {
    if (toast.autoClose !== false) {
      const duration = toast.duration || 5000;
      const timer = setTimeout(() => {
        onClose(toast.id);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  return (
    <div className={`
      relative w-full max-w-sm mx-auto mb-4 p-4 border rounded-lg shadow-lg
      transform transition-all duration-300 ease-in-out
      ${config.bgClass}
      animate-slide-in-right
    `}>
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <IconComponent className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.iconClass}`} />
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-semibold ${config.titleClass}`}>
            {toast.title}
          </h4>
          {toast.message && (
            <p className="mt-1 text-sm text-gray-600">
              {toast.message}
            </p>
          )}
        </div>
        
        {/* Close button */}
        <button
          onClick={() => onClose(toast.id)}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* Progress bar for auto-close */}
      {toast.autoClose !== false && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden">
          <div 
            className={`h-full transition-all ease-linear ${
              toast.type === 'success' ? 'bg-success-500' :
              toast.type === 'error' ? 'bg-error-500' :
              toast.type === 'warning' ? 'bg-warning-500' :
              'bg-primary-500'
            }`}
            style={{ 
              width: '100%',
              animation: `toast-progress ${toast.duration || 5000}ms linear forwards`
            }}
          />
        </div>
      )}
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: ToastMessage = {
      ...toast,
      id,
      autoClose: toast.autoClose !== false,
      duration: toast.duration || 5000
    };
    
    setToasts(prev => [...prev, newToast]);
  };

  const hideToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearAllToasts = () => {
    setToasts([]);
  };

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast, clearAllToasts }}>
      {children}
      
      {/* Toast Container */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-h-screen overflow-y-auto">
          {toasts.map(toast => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onClose={hideToast}
            />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
};

// Helper hooks for common toast types
export const useSuccessToast = () => {
  const { showToast } = useToast();
  return (title: string, message?: string) => 
    showToast({ type: 'success', title, message });
};

export const useErrorToast = () => {
  const { showToast } = useToast();
  return (title: string, message?: string) => 
    showToast({ type: 'error', title, message, autoClose: false });
};

export const useWarningToast = () => {
  const { showToast } = useToast();
  return (title: string, message?: string) => 
    showToast({ type: 'warning', title, message });
};

export const useInfoToast = () => {
  const { showToast } = useToast();
  return (title: string, message?: string) => 
    showToast({ type: 'info', title, message });
};