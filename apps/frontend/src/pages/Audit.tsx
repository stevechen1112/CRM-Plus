import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  Calendar,
  Download,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  User,
  Activity,
  AlertCircle,
  CheckCircle,
  Eye,
  RefreshCw,
} from 'lucide-react';

import { auditService, AuditQuery } from '@/services/audit';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  LoadingSpinner,
  PermissionGate 
} from '@/components/common';


const Audit: React.FC = () => {
  const { can } = usePermissions();
  
  // State
  const [query, setQuery] = useState<AuditQuery>({
    page: 1,
    limit: 20,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  // Queries
  const auditQuery = useQuery({
    queryKey: ['audit-logs', query],
    queryFn: () => auditService.getAuditLogs(query),
    enabled: can('audit.view'),
  });

  // Event handlers
  const handleSearch = useCallback((searchTerm: string) => {
    // For audit logs, we'll search by action or entity
    setQuery(prev => ({ ...prev, action: searchTerm || undefined, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setQuery(prev => ({ ...prev, page }));
  }, []);

  const handleFilterChange = (filters: Partial<AuditQuery>) => {
    setQuery(prev => ({ ...prev, ...filters, page: 1 }));
  };

  const handleExport = async () => {
    if (!can('audit.export')) {
      toast.error('您沒有匯出權限');
      return;
    }

    setIsExporting(true);
    try {
      const blob = await auditService.exportAuditLogs(query);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('稽核日誌匯出成功');
    } catch (error: any) {
      toast.error(error.response?.data?.message || '匯出失敗');
    } finally {
      setIsExporting(false);
    }
  };

  const toggleRowExpansion = (logId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(logId)) {
      newExpandedRows.delete(logId);
    } else {
      newExpandedRows.add(logId);
    }
    setExpandedRows(newExpandedRows);
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('POST')) return 'text-green-600';
    if (action.includes('UPDATE') || action.includes('PATCH') || action.includes('PUT')) return 'text-blue-600';
    if (action.includes('DELETE')) return 'text-red-600';
    return 'text-gray-600';
  };

  const getEntityIcon = (entity: string) => {
    switch (entity.toLowerCase()) {
      case 'customer':
      case 'customers':
        return <User className="w-4 h-4" />;
      case 'order':
      case 'orders':
        return <Activity className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  // Simple pagination logic
  const totalPages = Math.ceil((auditQuery.data?.total || 0) / (query.limit || 20));
  const canPrevious = (query.page || 1) > 1;
  const canNext = (query.page || 1) < totalPages;

  const handlePrevPage = () => {
    if (canPrevious) {
      handlePageChange((query.page || 1) - 1);
    }
  };

  const handleNextPage = () => {
    if (canNext) {
      handlePageChange((query.page || 1) + 1);
    }
  };

  // Loading state
  if (auditQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <PermissionGate requiredRoles={['ADMIN', 'MANAGER']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">稽核日誌</h1>
            <p className="text-sm text-gray-600">查看系統操作記錄和變更歷史</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-3 py-2 text-sm rounded-md border ${
                showFilters
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4 mr-2" />
              篩選
            </button>
            
            <PermissionGate requiredRoles={['ADMIN']}>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="btn btn-secondary"
              >
                {isExporting ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                匯出 CSV
              </button>
            </PermissionGate>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">篩選條件</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  開始日期
                </label>
                <input
                  type="date"
                  value={query.startDate || ''}
                  onChange={(e) => handleFilterChange({ startDate: e.target.value || undefined })}
                  className="form-input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  結束日期
                </label>
                <input
                  type="date"
                  value={query.endDate || ''}
                  onChange={(e) => handleFilterChange({ endDate: e.target.value || undefined })}
                  className="form-input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  實體類型
                </label>
                <select
                  value={query.entity || ''}
                  onChange={(e) => handleFilterChange({ entity: e.target.value || undefined })}
                  className="form-select"
                >
                  <option value="">全部實體</option>
                  <option value="customers">客戶</option>
                  <option value="orders">訂單</option>
                  <option value="interactions">交流紀錄</option>
                  <option value="tasks">任務</option>
                  <option value="users">使用者</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  狀態
                </label>
                <select
                  value={query.status || ''}
                  onChange={(e) => handleFilterChange({ status: e.target.value as 'success' | 'error' || undefined })}
                  className="form-select"
                >
                  <option value="">全部狀態</option>
                  <option value="success">成功</option>
                  <option value="error">失敗</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center justify-end mt-4 space-x-2">
              <button
                onClick={() => {
                  setQuery({ page: 1, limit: 20 });
                  setShowFilters(false);
                }}
                className="btn btn-secondary"
              >
                重置
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="btn btn-primary"
              >
                套用篩選
              </button>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="搜尋操作或實體類型..."
              className="form-input pl-10"
              value={query.action || ''}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    時間
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    使用者
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP 位址
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    實體 ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    狀態
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    延遲
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    變更
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {auditQuery.isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <LoadingSpinner size="lg" />
                    </td>
                  </tr>
                ) : (auditQuery.data?.auditLogs?.length || 0) === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      尚無稽核記錄
                    </td>
                  </tr>
                ) : (
                  (auditQuery.data?.auditLogs || []).map((log) => (
                    <React.Fragment key={log?.id || Math.random()}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {log?.createdAt ? format(new Date(log.createdAt), 'yyyy/MM/dd') : '未知日期'}
                            </div>
                            <div className="text-gray-500">
                              {log?.createdAt ? format(new Date(log.createdAt), 'HH:mm:ss') : '未知時間'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{log?.user?.name || '未知用戶'}</div>
                            <div className="text-gray-500">{log?.user?.email || '無信箱'}</div>
                            <div className="text-xs text-gray-400">
                              {(log?.user?.role === 'ADMIN') ? '管理員' : (log?.user?.role === 'MANAGER') ? '經理' : '職員'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono text-gray-600">{log?.userIp || '未知IP'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getEntityIcon(log?.entity || 'unknown')}
                            <div>
                              <div className={`font-medium ${getActionColor(log?.action || 'unknown')}`}>
                                {log?.action || '未知操作'}
                              </div>
                              <div className="text-xs text-gray-500">{log?.entity || '未知實體'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono text-gray-600">
                            {(log?.entityId || '').length > 8 ? `${(log?.entityId || '').substring(0, 8)}...` : (log?.entityId || '未知ID')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            {(log?.status || 'error') === 'success' ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span
                              className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                (log?.status || 'error') === 'success'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {(log?.status || 'error') === 'success' ? '成功' : '失敗'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{log?.latencyMs || 0}ms</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleRowExpansion(log?.id || '')}
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                            disabled={!log?.changes}
                          >
                            {expandedRows.has(log?.id || '') ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            <Eye className="w-4 h-4" />
                            <span className="text-sm">查看</span>
                          </button>
                        </td>
                      </tr>
                      {expandedRows.has(log?.id || '') && log?.changes && (
                        <tr>
                          <td colSpan={8} className="px-6 py-4 bg-gray-50">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">請求詳情</h4>
                                <dl className="space-y-1 text-sm">
                                  <div className="flex">
                                    <dt className="font-medium text-gray-500 w-20">請求 ID:</dt>
                                    <dd className="text-gray-900 font-mono">{log?.requestId || '未知'}</dd>
                                  </div>
                                  <div className="flex">
                                    <dt className="font-medium text-gray-500 w-20">使用者 ID:</dt>
                                    <dd className="text-gray-900 font-mono">{log?.userId || '未知'}</dd>
                                  </div>
                                  <div className="flex">
                                    <dt className="font-medium text-gray-500 w-20">IP 位址:</dt>
                                    <dd className="text-gray-900 font-mono">{log?.userIp || '未知'}</dd>
                                  </div>
                                  <div className="flex">
                                    <dt className="font-medium text-gray-500 w-20">延遲:</dt>
                                    <dd className="text-gray-900">{log?.latencyMs || 0}ms</dd>
                                  </div>
                                </dl>
                              </div>
                              
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">變更內容</h4>
                                <div className="bg-gray-100 rounded-md p-3 max-h-64 overflow-y-auto">
                                  <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                                    {JSON.stringify(log?.changes || {}, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {auditQuery.data && auditQuery.data.total > 0 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={handlePrevPage}
                    disabled={!canPrevious}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一頁
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={!canNext}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一頁
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      顯示第 <span className="font-medium">{((query.page || 1) - 1) * (query.limit || 20) + 1}</span> 到{' '}
                      <span className="font-medium">
                        {Math.min((query.page || 1) * (query.limit || 20), auditQuery.data.total)}
                      </span>{' '}
                      筆，共 <span className="font-medium">{auditQuery.data.total}</span> 筆記錄
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={handlePrevPage}
                        disabled={!canPrevious}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        上一頁
                      </button>
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        {query.page || 1} / {totalPages}
                      </span>
                      <button
                        onClick={handleNextPage}
                        disabled={!canNext}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        下一頁
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {auditQuery.data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <Activity className="w-8 h-8 text-blue-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">總記錄數</p>
                  <p className="text-2xl font-bold text-gray-900">{auditQuery.data.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">成功操作</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(auditQuery.data?.auditLogs || []).filter(log => log?.status === 'success').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">失敗操作</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(auditQuery.data?.auditLogs || []).filter(log => log?.status === 'error').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-purple-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">今日記錄</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(auditQuery.data?.auditLogs || []).filter(log => {
                      if (!log?.createdAt) return false;
                      const logDate = format(new Date(log.createdAt), 'yyyy-MM-dd');
                      const today = format(new Date(), 'yyyy-MM-dd');
                      return logDate === today;
                    }).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGate>
  );
};

export default Audit;