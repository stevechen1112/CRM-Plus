import React from 'react';
import { X } from 'lucide-react';

export interface FormModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  onSubmit?: (event: React.FormEvent) => void;
  children: React.ReactNode;
  
  // Footer actions
  confirmText?: string;
  confirmLoading?: boolean;
  confirmDisabled?: boolean;
  onConfirm?: () => void;
  
  cancelText?: string;
  onCancel?: () => void;
  
  // Custom footer
  footer?: React.ReactNode;
  hideFooter?: boolean;
  
  // Modal size
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  
  // Close options
  maskClosable?: boolean;
  escClosable?: boolean;
  
  // Styling
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg', 
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4'
};

export const FormModal: React.FC<FormModalProps> = ({
  title,
  open,
  onClose,
  onSubmit,
  children,
  confirmText = '確認',
  confirmLoading = false,
  confirmDisabled = false,
  onConfirm,
  cancelText = '取消',
  onCancel,
  footer,
  hideFooter = false,
  size = 'md',
  maskClosable = true,
  escClosable = true,
  className = ''
}) => {
  // Handle ESC key
  React.useEffect(() => {
    if (!escClosable || !open) return;
    
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [escClosable, open, onClose]);
  
  // Handle body scroll lock
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open) return null;

  const handleMaskClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && maskClosable) {
      onClose();
    }
  };

  const handleCancel = () => {
    onCancel ? onCancel() : onClose();
  };

  const handleConfirm = () => {
    onConfirm?.();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (onSubmit) {
      onSubmit(event);
    } else {
      handleConfirm();
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
        
        {/* Modal */}
        <div className={`
          relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all
          w-full ${sizeClasses[size]} ${className}
        `}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="rounded-md p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Body */}
          <form onSubmit={handleSubmit}>
            <div className="p-6 max-h-96 overflow-y-auto">
              {children}
            </div>
            
            {/* Footer */}
            {!hideFooter && (
              <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
                {footer || (
                  <>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="btn btn-secondary"
                    >
                      {cancelText}
                    </button>
                    <button
                      type={onSubmit ? 'submit' : 'button'}
                      onClick={onSubmit ? undefined : handleConfirm}
                      disabled={confirmDisabled || confirmLoading}
                      className="btn btn-primary"
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
                  </>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};