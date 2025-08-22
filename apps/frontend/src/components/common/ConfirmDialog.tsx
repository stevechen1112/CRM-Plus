import React from 'react';
import { AlertTriangle, Trash2, AlertCircle, HelpCircle } from 'lucide-react';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  
  title: string;
  description?: string;
  
  type?: 'warning' | 'danger' | 'info' | 'question';
  
  confirmText?: string;
  cancelText?: string;
  
  confirmLoading?: boolean;
  confirmDisabled?: boolean;
  
  // Styling
  className?: string;
}

const typeConfig = {
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-warning-600 bg-warning-100',
    confirmButtonClass: 'btn-warning'
  },
  danger: {
    icon: Trash2,
    iconClass: 'text-error-600 bg-error-100', 
    confirmButtonClass: 'btn-error'
  },
  info: {
    icon: AlertCircle,
    iconClass: 'text-primary-600 bg-primary-100',
    confirmButtonClass: 'btn-primary'
  },
  question: {
    icon: HelpCircle,
    iconClass: 'text-blue-600 bg-blue-100',
    confirmButtonClass: 'btn-primary'
  }
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  type = 'warning',
  confirmText = '確認',
  cancelText = '取消',
  confirmLoading = false,
  confirmDisabled = false,
  className = ''
}) => {
  const config = typeConfig[type];
  const IconComponent = config.icon;
  
  // Handle ESC key
  React.useEffect(() => {
    if (!open) return;
    
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleMaskClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (!confirmDisabled && !confirmLoading) {
      onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="flex min-h-full items-center justify-center p-4"
        onClick={handleMaskClick}
      >
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
        
        {/* Dialog */}
        <div className={`
          relative transform overflow-hidden rounded-lg bg-white px-6 py-6 text-left shadow-xl transition-all
          w-full max-w-md ${className}
        `}>
          <div className="flex items-start space-x-4">
            {/* Icon */}
            <div className={`flex-shrink-0 mx-auto flex items-center justify-center h-12 w-12 rounded-full ${config.iconClass}`}>
              <IconComponent className="h-6 w-6" />
            </div>
            
            {/* Content */}
            <div className="flex-1 pt-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {title}
              </h3>
              
              {description && (
                <p className="text-sm text-gray-600 mb-6">
                  {description}
                </p>
              )}
              
              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary"
                  disabled={confirmLoading}
                >
                  {cancelText}
                </button>
                
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={confirmDisabled || confirmLoading}
                  className={`btn ${config.confirmButtonClass}`}
                >
                  {confirmLoading ? (
                    <>
                      <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      處理中...
                    </>
                  ) : (
                    confirmText
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook for easier usage
export const useConfirmDialog = () => {
  const [dialogState, setDialogState] = React.useState<{
    open: boolean;
    props: Partial<ConfirmDialogProps>;
  }>({
    open: false,
    props: {}
  });

  const showConfirm = React.useCallback((props: Omit<ConfirmDialogProps, 'open' | 'onClose' | 'onConfirm'> & {
    onConfirm: () => void | Promise<void>;
  }) => {
    return new Promise<boolean>((resolve) => {
      setDialogState({
        open: true,
        props: {
          ...props,
          onConfirm: async () => {
            try {
              await props.onConfirm();
              setDialogState(prev => ({ ...prev, open: false }));
              resolve(true);
            } catch (error) {
              // Don't close dialog on error, let onConfirm handle it
              resolve(false);
            }
          },
          onClose: () => {
            setDialogState(prev => ({ ...prev, open: false }));
            resolve(false);
          }
        }
      });
    });
  }, []);

  const closeConfirm = React.useCallback(() => {
    setDialogState(prev => ({ ...prev, open: false }));
  }, []);

  const ConfirmDialogComponent = React.useCallback(() => (
    <ConfirmDialog
      {...dialogState.props as ConfirmDialogProps}
      open={dialogState.open}
      onClose={closeConfirm}
      onConfirm={() => dialogState.props.onConfirm?.()}
    />
  ), [dialogState, closeConfirm]);

  return {
    showConfirm,
    closeConfirm,
    ConfirmDialog: ConfirmDialogComponent
  };
};