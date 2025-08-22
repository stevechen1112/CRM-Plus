import React, { useState } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  Download, 
  Upload, 
  Search, 
  Filter
} from 'lucide-react';

export interface TableColumn<T = any> {
  key: keyof T | string;
  title: string;
  sortable?: boolean;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  width?: string;
  className?: string;
}

export interface TableAction<T = any> {
  label: string;
  icon?: React.ReactNode;
  onClick: (record: T) => void;
  show?: (record: T) => boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}

export interface TableListProps<T = any> {
  // Data
  data: T[];
  loading?: boolean;
  columns: TableColumn<T>[];
  
  // Pagination
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    showSizeChanger?: boolean;
    pageSizeOptions?: string[];
    onPageChange: (page: number, pageSize: number) => void;
  };
  
  // Sorting
  sortConfig?: {
    key: string;
    direction: 'asc' | 'desc';
  };
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  
  // Search & Filters
  searchable?: boolean;
  searchValue?: string;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  
  filters?: React.ReactNode;
  
  // Actions
  rowActions?: TableAction<T>[];
  toolbarActions?: React.ReactNode;
  
  // Export
  exportable?: boolean;
  onExport?: () => void;
  exportLoading?: boolean;
  
  // Import
  importable?: boolean;
  onImportClick?: () => void;
  
  // Selection
  selectable?: boolean;
  selectedRowKeys?: string[];
  onSelectionChange?: (selectedRowKeys: string[], selectedRows: T[]) => void;
  rowKey?: keyof T | ((record: T) => string);
  
  // Empty state
  emptyText?: string;
  emptyDescription?: string;
  
  // Mobile responsive
  mobileCardRender?: (record: T, index: number) => React.ReactNode;
}

export function TableList<T = any>({
  data,
  loading = false,
  columns,
  pagination,
  sortConfig,
  onSort,
  searchable = false,
  searchValue = '',
  onSearch,
  searchPlaceholder = '搜尋...',
  filters,
  rowActions,
  toolbarActions,
  exportable = false,
  onExport,
  exportLoading = false,
  importable = false,
  onImportClick,
  selectable = false,
  selectedRowKeys = [],
  onSelectionChange,
  rowKey = 'id' as keyof T,
  emptyText = '暫無資料',
  emptyDescription,
  mobileCardRender,
}: TableListProps<T>) {
  const [searchInput, setSearchInput] = useState(searchValue);

  const getRowKey = (record: T): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return String(record[rowKey as keyof T]);
  };

  const handleSort = (key: string) => {
    if (!onSort) return;
    
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    onSort(key, direction);
  };

  const handleSearch = (value: string) => {
    setSearchInput(value);
    onSearch?.(value);
  };

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    
    if (checked) {
      const allKeys = data.map(record => getRowKey(record));
      onSelectionChange(allKeys, data);
    } else {
      onSelectionChange([], []);
    }
  };

  const handleSelectRow = (record: T, checked: boolean) => {
    if (!onSelectionChange) return;
    
    const key = getRowKey(record);
    let newSelectedKeys = [...selectedRowKeys];
    let newSelectedRows = [...data.filter(item => selectedRowKeys.includes(getRowKey(item)))];
    
    if (checked) {
      newSelectedKeys.push(key);
      newSelectedRows.push(record);
    } else {
      newSelectedKeys = newSelectedKeys.filter(k => k !== key);
      newSelectedRows = newSelectedRows.filter(item => getRowKey(item) !== key);
    }
    
    onSelectionChange(newSelectedKeys, newSelectedRows);
  };

  const isAllSelected = selectedRowKeys.length === data.length && data.length > 0;
  const isIndeterminate = selectedRowKeys.length > 0 && selectedRowKeys.length < data.length;

  // Mobile card view component
  const MobileCard: React.FC<{ record: T; index: number }> = ({ record, index }) => {
    if (mobileCardRender) {
      return <div className="bg-white rounded-lg p-4 border border-gray-200">{mobileCardRender(record, index)}</div>;
    }

    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-2">
        {columns.slice(0, 3).map((column) => {
          const value = record[column.key as keyof T];
          const displayValue = column.render ? column.render(value, record, index) : String(value || '');
          
          return (
            <div key={String(column.key)} className="flex justify-between items-center">
              <span className="text-sm text-gray-500">{column.title}</span>
              <span className="text-sm font-medium text-gray-900">{displayValue}</span>
            </div>
          );
        })}
        
        {rowActions && rowActions.length > 0 && (
          <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
            {rowActions.map((action) => {
              if (action.show && !action.show(record)) return null;
              
              return (
                <button
                  key={action.label}
                  onClick={() => action.onClick(record)}
                  className={`btn btn-sm btn-secondary ${action.className || ''}`}
                >
                  {action.icon}
                  <span className="ml-1">{action.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          {searchable && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-10 form-input"
              />
            </div>
          )}
          
          {/* Filters */}
          {filters}
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          {importable && (
            <button onClick={onImportClick} className="btn btn-secondary">
              <Upload className="w-4 h-4 mr-2" />
              匯入
            </button>
          )}
          
          {exportable && (
            <button 
              onClick={onExport} 
              disabled={exportLoading}
              className="btn btn-secondary"
            >
              <Download className="w-4 h-4 mr-2" />
              {exportLoading ? '匯出中...' : '匯出'}
            </button>
          )}
          
          {toolbarActions}
        </div>
      </div>

      {/* Selection info */}
      {selectable && selectedRowKeys.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <span className="text-sm text-blue-700">
            已選取 {selectedRowKeys.length} 項
          </span>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {selectable && (
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = isIndeterminate;
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="form-checkbox rounded"
                    />
                  </th>
                )}
                
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      column.className || ''
                    }`}
                    style={{ width: column.width }}
                  >
                    {column.sortable ? (
                      <button
                        onClick={() => handleSort(String(column.key))}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>{column.title}</span>
                        {sortConfig?.key === column.key ? (
                          sortConfig.direction === 'asc' ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )
                        ) : (
                          <div className="w-4 h-4" />
                        )}
                      </button>
                    ) : (
                      column.title
                    )}
                  </th>
                ))}
                
                {rowActions && rowActions.length > 0 && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                )}
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={columns.length + (selectable ? 1 : 0) + (rowActions?.length ? 1 : 0)} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="spinner w-6 h-6" />
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (selectable ? 1 : 0) + (rowActions?.length ? 1 : 0)} className="px-6 py-12 text-center">
                    <div className="text-gray-400">
                      <Filter className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-lg font-medium">{emptyText}</p>
                      {emptyDescription && <p className="text-sm mt-1">{emptyDescription}</p>}
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((record, index) => (
                  <tr key={getRowKey(record)} className="hover:bg-gray-50">
                    {selectable && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedRowKeys.includes(getRowKey(record))}
                          onChange={(e) => handleSelectRow(record, e.target.checked)}
                          className="form-checkbox rounded"
                        />
                      </td>
                    )}
                    
                    {columns.map((column) => {
                      const value = record[column.key as keyof T];
                      const displayValue = column.render ? column.render(value, record, index) : String(value || '');
                      
                      return (
                        <td
                          key={String(column.key)}
                          className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${column.className || ''}`}
                        >
                          {displayValue}
                        </td>
                      );
                    })}
                    
                    {rowActions && rowActions.length > 0 && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {rowActions.map((action) => {
                            if (action.show && !action.show(record)) return null;
                            
                            return (
                              <button
                                key={action.label}
                                onClick={() => action.onClick(record)}
                                className={`text-gray-400 hover:text-gray-600 ${action.className || ''}`}
                                title={action.label}
                              >
                                {action.icon}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="block md:hidden space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner w-6 h-6" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-12">
            <Filter className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-lg font-medium text-gray-500">{emptyText}</p>
            {emptyDescription && <p className="text-sm text-gray-400 mt-1">{emptyDescription}</p>}
          </div>
        ) : (
          data.map((record, index) => (
            <MobileCard key={getRowKey(record)} record={record} index={index} />
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.total > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white px-6 py-3 border-t border-gray-200 rounded-b-lg">
          <div className="flex items-center text-sm text-gray-700 mb-4 sm:mb-0">
            <span>
              顯示第 {(pagination.current - 1) * pagination.pageSize + 1} - {' '}
              {Math.min(pagination.current * pagination.pageSize, pagination.total)} 項，
              共 {pagination.total} 項
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => pagination.onPageChange(pagination.current - 1, pagination.pageSize)}
              disabled={pagination.current <= 1}
              className="btn btn-sm btn-secondary"
            >
              上一頁
            </button>
            
            <span className="text-sm text-gray-700">
              第 {pagination.current} 頁，共 {Math.ceil(pagination.total / pagination.pageSize)} 頁
            </span>
            
            <button
              onClick={() => pagination.onPageChange(pagination.current + 1, pagination.pageSize)}
              disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
              className="btn btn-sm btn-secondary"
            >
              下一頁
            </button>
          </div>
        </div>
      )}
    </div>
  );
}