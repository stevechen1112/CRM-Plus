import React, { useState } from 'react';
import { 
  Download, 
  Upload, 
  Search, 
  Eye, 
  Edit, 
  Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useOrders, useDeleteOrder, useOrderExport } from '@/hooks/useOrders';
import { OrdersQueryParams } from '@/services/orders';
import { PermissionGate, TableList, useConfirmDialog, Tooltip } from '@/components/common';
import { usePermissions } from '@/hooks/usePermissions';
import type { TableColumn, TableAction } from '@/components/common/TableList';
import type { OrderWithCustomer, PaymentStatus, OrderStatus } from '@/services/orders';

// 狀態標籤樣式
const getPaymentStatusStyle = (status: PaymentStatus) => {
  switch (status) {
    case 'PAID': return 'bg-success-100 text-success-800';
    case 'PENDING': return 'bg-warning-100 text-warning-800';
    case 'FAILED': return 'bg-error-100 text-error-800';
    case 'REFUNDED': return 'bg-gray-100 text-gray-800';
    case 'PARTIAL': return 'bg-primary-100 text-primary-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getOrderStatusStyle = (status: OrderStatus) => {
  switch (status) {
    case 'DELIVERED': return 'bg-success-100 text-success-800';
    case 'SHIPPED': return 'bg-primary-100 text-primary-800';
    case 'PROCESSING': return 'bg-warning-100 text-warning-800';
    case 'CONFIRMED': return 'bg-info-100 text-info-800';
    case 'CANCELLED': return 'bg-error-100 text-error-800';
    case 'DRAFT': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: '待付款',
  PAID: '已付款',
  FAILED: '付款失敗',
  REFUNDED: '已退款',
  PARTIAL: '部分付款'
};

const orderStatusLabels: Record<OrderStatus, string> = {
  DRAFT: '草稿',
  CONFIRMED: '已確認',
  PROCESSING: '處理中',
  SHIPPED: '已出貨',
  DELIVERED: '已送達',
  CANCELLED: '已取消'
};

const Orders: React.FC = () => {
  const [filters, setFilters] = useState<OrdersQueryParams>({
    page: 1,
    limit: 20
  });
  
  const { data: ordersData, isLoading } = useOrders(filters);
  const deleteOrderMutation = useDeleteOrder();
  const exportMutation = useOrderExport();
  const { can } = usePermissions();
  const confirmDialog = useConfirmDialog();

  // 處理篩選變更
  const handleFilterChange = (key: keyof OrdersQueryParams, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
      page: 1 // 重置頁碼
    }));
  };

  // 處理搜尋
  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({
      ...prev,
      search: searchTerm || undefined,
      page: 1
    }));
  };

  // 處理匯出
  const handleExport = () => {
    const exportParams = { ...filters };
    delete exportParams.page;
    delete exportParams.limit;
    exportMutation.mutate(exportParams);
  };

  // 處理刪除
  const handleDelete = async (order: OrderWithCustomer) => {
    const confirmed = await confirmDialog.showConfirm({
      title: '確認刪除訂單',
      description: `確定要刪除訂單 ${(order.id || order.orderNo || "無訂單號")} 嗎？此操作無法復原。`,
      confirmText: '刪除',
      cancelText: '取消',
      type: 'danger',
      onConfirm: () => Promise.resolve()
    });

    if (confirmed) {
      deleteOrderMutation.mutate(order?.id || '');
    }
  };

  // 表格欄位定義
  const columns: TableColumn<OrderWithCustomer>[] = [
    {
      key: 'orderNo',
      title: '訂單編號',
      render: (order) => (
        <div className="font-medium text-primary-600">
          {(order.id || order.orderNo || "無訂單號")}
        </div>
      )
    },
    {
      key: 'customer',
      title: '客戶資訊',
      render: (order) => (
        <div>
          <div className="font-medium text-gray-900">
            {order?.customerPhoner?.name || '未知客戶'}
          </div>
          <div className="text-sm text-gray-500">
            {order?.customerPhonerPhone || '無電話'}
          </div>
        </div>
      )
    },
    {
      key: 'totalAmount',
      title: '訂單金額',
      render: (order) => (
        <div className="font-medium text-gray-900">
          NT$ {(order?.totalAmount || 0).toLocaleString()}
        </div>
      )
    },
    {
      key: 'paymentStatus',
      title: '付款狀態',
      render: (order) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          getPaymentStatusStyle(order?.paymentStatus || 'PENDING')
        }`}>
          {paymentStatusLabels[(order?.paymentStatus || 'PENDING') as PaymentStatus]}
        </span>
      )
    },
    {
      key: 'orderStatus',
      title: '訂單狀態',
      render: (order) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          getOrderStatusStyle(order?.orderStatus || 'DRAFT')
        }`}>
          {orderStatusLabels[(order?.orderStatus || 'DRAFT') as OrderStatus]}
        </span>
      )
    },
    {
      key: 'createdAt',
      title: '建立時間',
      render: (order) => (
        <div className="text-sm text-gray-900">
          {order?.createdAt ? format(new Date(order.createdAt), 'yyyy/MM/dd HH:mm') : '未知日期'}
        </div>
      )
    }
  ];

  // 表格操作定義
  const actions: TableAction<OrderWithCustomer>[] = [
    {
      label: '查看',
      icon: <Eye className="w-4 h-4" />,
      onClick: (order) => window.open(`/orders/${order?.id || 'unknown'}`, '_blank'),
      variant: 'primary'
    },
    {
      label: '編輯',
      icon: <Edit className="w-4 h-4" />,
      onClick: (order) => window.open(`/orders/${order?.id || 'unknown'}`, '_blank'),
      show: () => can('orders.edit'),
      variant: 'secondary'
    },
    {
      label: '刪除',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: handleDelete,
      show: () => can('orders.delete'),
      variant: 'danger'
    }
  ];

  // 移動端卡片渲染函數
  const renderMobileCard = (order: OrderWithCustomer) => (
    <div className="space-y-3">
      {/* 訂單編號和狀態 */}
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium text-primary-600 text-base">
            {(order.id || order.orderNo || "無訂單號")}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {order?.createdAt ? format(new Date(order.createdAt), 'yyyy/MM/dd HH:mm') : '未知日期'}
          </div>
        </div>
        <div className="flex space-x-1">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            getPaymentStatusStyle(order?.paymentStatus || 'PENDING')
          }`}>
            {paymentStatusLabels[(order?.paymentStatus || 'PENDING') as PaymentStatus]}
          </span>
        </div>
      </div>
      
      {/* 客戶資訊 */}
      <div className="border-l-4 border-gray-200 pl-3">
        <div className="font-medium text-gray-900">
          {order?.customerPhoner?.name || '未知客戶'}
        </div>
        <div className="text-sm text-gray-500">
          {order?.customerPhonerPhone || '無電話'}
        </div>
      </div>
      
      {/* 金額和訂單狀態 */}
      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
        <div>
          <div className="text-xs text-gray-500">訂單金額</div>
          <div className="font-semibold text-gray-900">
            NT$ {(order?.totalAmount || 0).toLocaleString()}
          </div>
        </div>
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          getOrderStatusStyle(order?.orderStatus || 'DRAFT')
        }`}>
          {orderStatusLabels[(order?.orderStatus || 'DRAFT') as OrderStatus]}
        </span>
      </div>
      
      {/* 操作按鈕 */}
      <div className="flex justify-end space-x-2 pt-2">
        {actions.map((action) => {
          if (action.show && !action.show(order)) return null;
          
          const variantClasses = {
            primary: 'btn-primary',
            secondary: 'btn-secondary', 
            danger: 'btn-error',
            ghost: 'btn-ghost'
          };
          
          return (
            <button
              key={action.label}
              onClick={() => action.onClick(order)}
              className={`btn btn-sm ${variantClasses[action.variant as keyof typeof variantClasses] || 'btn-secondary'}`}
            >
              {action.icon}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">訂單管理</h1>
          <p className="text-gray-600">管理客戶訂單和交易記錄</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <PermissionGate requiredPermissions={['orders.import']}>
            <Tooltip content={can('orders.import') ? '' : '無足夠權限，請聯繫管理員'}>
              <Link 
                to="/import" 
                className={`btn btn-secondary ${!can('orders.import') ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={(e) => !can('orders.import') && e.preventDefault()}
              >
                <Upload className="w-4 h-4 mr-2" />
                匯入資料
              </Link>
            </Tooltip>
          </PermissionGate>
          <PermissionGate requiredPermissions={['orders.export']}>
            <Tooltip content={can('orders.export') ? '' : '無足夠權限，請聯繫管理員'}>
              <button 
                onClick={handleExport}
                disabled={exportMutation.isPending || !can('orders.export')}
                className="btn btn-secondary"
              >
                <Download className="w-4 h-4 mr-2" />
                {exportMutation.isPending ? '匯出中...' : '匯出 CSV'}
              </button>
            </Tooltip>
          </PermissionGate>
        </div>
      </div>

      {/* 篩選器 */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* 搜尋框 */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                搜尋
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="搜尋訂單編號或客戶電話..."
                  className="pl-10 form-input"
                  value={filters.search || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>
            
            {/* 付款狀態 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                付款狀態
              </label>
              <select 
                className="form-select"
                value={filters.paymentStatus || ''}
                onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
              >
                <option value="">所有狀態</option>
                <option value="PENDING">待付款</option>
                <option value="PAID">已付款</option>
                <option value="FAILED">付款失敗</option>
                <option value="REFUNDED">已退款</option>
                <option value="PARTIAL">部分付款</option>
              </select>
            </div>
            
            {/* 訂單狀態 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                訂單狀態
              </label>
              <select 
                className="form-select"
                value={filters.orderStatus || ''}
                onChange={(e) => handleFilterChange('orderStatus', e.target.value)}
              >
                <option value="">所有狀態</option>
                <option value="DRAFT">草稿</option>
                <option value="CONFIRMED">已確認</option>
                <option value="PROCESSING">處理中</option>
                <option value="SHIPPED">已出貨</option>
                <option value="DELIVERED">已送達</option>
                <option value="CANCELLED">已取消</option>
              </select>
            </div>
            
            {/* 日期範圍 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                開始日期
              </label>
              <input
                type="date"
                className="form-input"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                結束日期
              </label>
              <input
                type="date"
                className="form-input"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
          </div>
          
          {/* 金額範圍 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                最小金額
              </label>
              <input
                type="number"
                placeholder="0"
                className="form-input"
                value={filters.minAmount || ''}
                onChange={(e) => handleFilterChange('minAmount', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                最大金額
              </label>
              <input
                type="number"
                placeholder="無限制"
                className="form-input"
                value={filters.maxAmount || ''}
                onChange={(e) => handleFilterChange('maxAmount', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* 訂單列表 */}
      <TableList
        data={ordersData?.data || []}
        columns={columns}
        rowActions={actions}
        loading={isLoading}
        pagination={ordersData?.pagination ? {
          current: ordersData.pagination.page,
          pageSize: ordersData.pagination.limit,
          total: ordersData.pagination.total,
          onPageChange: (page: number) => handleFilterChange('page', page)
        } : undefined}
        mobileCardRender={renderMobileCard}
        emptyText="暫無訂單"
        emptyDescription="還沒有任何訂單記錄"
      />
      
      <confirmDialog.ConfirmDialog />
    </div>
  );
};

export default Orders;