import React, { useState, useRef } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle } from 'lucide-react';

export interface FileUploaderProps {
  // Basic props
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in bytes
  
  // Files
  files?: File[];
  onChange?: (files: File[]) => void;
  
  // Upload behavior
  autoUpload?: boolean;
  onUpload?: (files: File[]) => Promise<void>;
  uploadProgress?: number;
  uploading?: boolean;
  
  // Validation
  validator?: (file: File) => string | null;
  
  // UI customization
  placeholder?: string;
  description?: string;
  showPreview?: boolean;
  showProgress?: boolean;
  
  // Drag & drop
  disabled?: boolean;
  
  // Error handling
  error?: string;
  
  // Styling
  className?: string;
  height?: string;
}

interface FileWithPreview extends File {
  id: string;
  preview?: string;
  error?: string;
  uploading?: boolean;
  progress?: number;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  accept,
  multiple = false,
  maxFiles = multiple ? 10 : 1,
  maxSize = 20 * 1024 * 1024, // 20MB default
  files = [],
  onChange,
  autoUpload = false,
  onUpload,
  uploadProgress,
  uploading = false,
  validator,
  placeholder = multiple ? '拖曳檔案到此處，或點擊選擇檔案' : '拖曳檔案到此處，或點擊選擇檔案',
  description,
  showPreview = true,
  showProgress = true,
  disabled = false,
  error,
  className = '',
  height = '160px'
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [internalFiles, setInternalFiles] = useState<FileWithPreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const fileList = files.length > 0 ? files : internalFiles;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Size validation
    if (file.size > maxSize) {
      return `檔案大小不能超過 ${formatFileSize(maxSize)}`;
    }
    
    // Custom validation
    if (validator) {
      return validator(file);
    }
    
    return null;
  };

  const processFiles = async (rawFiles: File[]) => {
    const newFiles: FileWithPreview[] = [];
    
    // Check max files limit
    const totalFiles = fileList.length + rawFiles.length;
    if (totalFiles > maxFiles) {
      const allowedCount = maxFiles - fileList.length;
      rawFiles = rawFiles.slice(0, allowedCount);
    }
    
    for (const rawFile of rawFiles) {
      const fileWithPreview: FileWithPreview = {
        ...rawFile,
        id: Math.random().toString(36).substring(7),
        error: validateFile(rawFile) || undefined
      };
      
      // Generate preview for images
      if (showPreview && rawFile.type.startsWith('image/')) {
        fileWithPreview.preview = URL.createObjectURL(rawFile);
      }
      
      newFiles.push(fileWithPreview);
    }
    
    const updatedFiles = [...(internalFiles || []), ...newFiles];
    setInternalFiles(updatedFiles);
    
    if (onChange) {
      onChange(updatedFiles.filter(f => !f.error));
    }
    
    // Auto upload if enabled
    if (autoUpload && onUpload) {
      const validFiles = newFiles.filter(f => !f.error);
      if (validFiles.length > 0) {
        try {
          await onUpload(validFiles);
        } catch (error) {
          console.error('Auto upload failed:', error);
        }
      }
    }
  };

  const removeFile = (fileId: string) => {
    const updatedFiles = internalFiles.filter(f => f.id !== fileId);
    setInternalFiles(updatedFiles);
    
    if (onChange) {
      onChange(updatedFiles.filter(f => !f.error));
    }
    
    // Cleanup preview URLs
    const removedFile = internalFiles.find(f => f.id === fileId);
    if (removedFile?.preview) {
      URL.revokeObjectURL(removedFile.preview);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled) return;
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    processFiles(selectedFiles);
    
    // Reset input value to allow selecting same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Cleanup preview URLs on unmount
  React.useEffect(() => {
    return () => {
      internalFiles.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg transition-colors cursor-pointer
          ${dragOver 
            ? 'border-primary-400 bg-primary-50' 
            : error 
              ? 'border-error-300 bg-error-50'
              : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        style={{ height }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
        />
        
        <div className="flex flex-col items-center justify-center h-full p-6">
          <Upload className={`w-12 h-12 mb-4 ${
            dragOver ? 'text-primary-500' : 'text-gray-400'
          }`} />
          
          <p className={`text-sm font-medium mb-2 ${
            dragOver ? 'text-primary-900' : 'text-gray-900'
          }`}>
            {placeholder}
          </p>
          
          {description && (
            <p className="text-xs text-gray-500 text-center max-w-xs">
              {description}
            </p>
          )}
          
          <div className="text-xs text-gray-400 mt-2 space-y-1 text-center">
            <div>最大檔案大小: {formatFileSize(maxSize)}</div>
            {multiple && <div>最多 {maxFiles} 個檔案</div>}
            {accept && <div>支援格式: {accept}</div>}
          </div>
        </div>
        
        {/* Upload Progress */}
        {showProgress && uploading && uploadProgress !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden">
            <div 
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 text-error-600 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {/* File Previews */}
      {showPreview && fileList.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">已選擇的檔案</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fileList.map((file) => {
              const fileWithPreview = file as FileWithPreview;
              
              return (
                <div
                  key={fileWithPreview.id || file.name}
                  className={`
                    flex items-center space-x-3 p-3 border rounded-lg
                    ${fileWithPreview.error ? 'border-error-200 bg-error-50' : 'border-gray-200 bg-gray-50'}
                  `}
                >
                  {/* File Icon/Preview */}
                  <div className="flex-shrink-0">
                    {fileWithPreview.preview ? (
                      <img
                        src={fileWithPreview.preview}
                        alt={file.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <FileText className="w-10 h-10 text-gray-400" />
                    )}
                  </div>
                  
                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                    
                    {fileWithPreview.error && (
                      <p className="text-xs text-error-600 flex items-center mt-1">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {fileWithPreview.error}
                      </p>
                    )}
                    
                    {!fileWithPreview.error && fileWithPreview.uploading && (
                      <p className="text-xs text-primary-600 flex items-center mt-1">
                        <div className="w-3 h-3 mr-1 animate-spin rounded-full border border-primary-600 border-t-transparent" />
                        上傳中...
                      </p>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex-shrink-0">
                    {!fileWithPreview.error && !fileWithPreview.uploading && (
                      <CheckCircle className="w-5 h-5 text-success-500" />
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(fileWithPreview.id || file.name);
                      }}
                      disabled={disabled}
                      className="ml-2 p-1 text-gray-400 hover:text-gray-600 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};