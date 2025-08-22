import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  CreditCard, 
  Package, 
  Edit2,
  Receipt,
  ClipboardList,
  Loader
} from 'lucide-react';
import { format } from 'date-fns';
import { useOrder, useUpdateOrder } from '@/hooks/useOrders';
import { PermissionGate, useConfirmDialog, Tooltip } from '@/components/common';
import { usePermissions } from '@/hooks/usePermissions';
import type { PaymentStatus, OrderStatus } from '@/services/orders';

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

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { can } = usePermissions();
  const confirmDialog = useConfirmDialog();

  const { data: order, isLoading, error } = useOrder(id!);
  const updateOrderMutation = useUpdateOrder();

  const [editingPayment, setEditingPayment] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | ''>('');
  const [orderStatus, setOrderStatus] = useState<OrderStatus | ''>('');

  // 初始化編輯狀態
  React.useEffect(() => {
    if (order) {
      setPaymentStatus(order.paymentStatus);
      setOrderStatus(order.orderStatus);
    }
  }, [order]);

  // 處理付款狀態更新
  const handlePaymentStatusUpdate = async () => {
    if (!order || !paymentStatus) return;

    const confirmed = await confirmDialog.showConfirm({
      title: '確認更新付款狀態',
      description: `確定要將付款狀態改為「${paymentStatusLabels[paymentStatus as PaymentStatus]}」嗎？`,
      confirmText: '確認',
      cancelText: '取消',
      onConfirm: () => Promise.resolve()
    });

    if (confirmed) {
      updateOrderMutation.mutate(
        { 
          id: order.id, 
          data: { paymentStatus: paymentStatus as PaymentStatus } 
        },
        {
          onSuccess: () => {
            setEditingPayment(false);
          }
        }
      );
    }
  };

  // 處理訂單狀態更新
  const handleOrderStatusUpdate = async () => {
    if (!order || !orderStatus) return;

    const confirmed = await confirmDialog.showConfirm({
      title: '確認更新訂單狀態',
      description: `確定要將訂單狀態改為「${orderStatusLabels[orderStatus as OrderStatus]}」嗎？`,
      confirmText: '確認',
      cancelText: '取消',
      onConfirm: () => Promise.resolve()
    });

    if (confirmed) {
      updateOrderMutation.mutate(
        { 
          id: order.id, 
          data: { orderStatus: orderStatus as OrderStatus } 
        },
        {
          onSuccess: () => {
            setEditingStatus(false);
          }
        }
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader className="w-6 h-6 animate-spin text-primary-600" />
          <span className="text-gray-600">載入中...</span>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">訂單不存在</h2>
        <p className="text-gray-600 mb-4">找不到指定的訂單，可能已被刪除或您沒有權限查看。</p>
        <Link to="/orders" className="btn btn-primary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回訂單列表
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 頁面標題 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3">
          <Link to="/orders" className="btn btn-ghost btn-sm">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              訂單詳情 - {(order.id || order.orderNo || "無訂單號")}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">查看和管理訂單資訊</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* 左側主要內容 */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* 基本資訊卡 */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Receipt className="w-5 h-5 mr-2" />
                基本資訊
              </h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    訂單編號
                  </label>
                  <p className="text-gray-900 font-medium">{(order.id || order.orderNo || "無訂單號")}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    客戶資訊
                  </label>
                  <div className="space-y-1">
                    <p className="text-gray-900 font-medium">
                      {order?.customerPhoner?.name || '未知客戶'}
                    </p>
                    <p className="text-sm text-gray-500">{order?.customerPhonerPhone || '無電話'}</p>
                    {order?.customerPhoner?.email && (
                      <p className="text-sm text-gray-500">{order?.customerPhoner?.email}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    建立時間
                  </label>
                  <p className="text-gray-900 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {format(new Date(order.createdAt), 'yyyy/MM/dd HH:mm')}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    更新時間
                  </label>
                  <p className="text-gray-900 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {format(new Date(order.updatedAt), 'yyyy/MM/dd HH:mm')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 商品明細 */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Package className="w-5 h-5 mr-2" />
                商品明細
              </h2>
            </div>
            <div className="card-body p-0">
              {/* 桌面版表格 */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        商品名稱
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        數量
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        單價
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        小計
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(order?.items || []).map((item) => (
                      <tr key={item?.id || Math.random()}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {item?.productName || '未知商品'}
                          </div>
                          {item?.notes && (
                            <div className="text-sm text-gray-500 mt-1">
                              {item?.notes}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item?.quantity || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          NT$ {(item?.unitPrice || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          NT$ {(item?.totalPrice || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                        總金額：
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">
                        NT$ {order.totalAmount.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              {/* 移動版卡片 */}
              <div className="sm:hidden p-4 space-y-4">
                {(order?.items || []).map((item) => (
                  <div key={item?.id || Math.random()} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 mr-4">
                        <div className="font-medium text-gray-900 text-sm">
                          {item?.productName || '未知商品'}
                        </div>
                        {item?.notes && (
                          <div className="text-xs text-gray-500 mt-1">
                            {item?.notes}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900 text-sm">
                          NT$ {(item?.totalPrice || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>數量: {item?.quantity || 0}</span>
                      <span>單價: NT$ {(item?.unitPrice || 0).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
                
                {/* 移動版總計 */}
                <div className="border-t-2 border-gray-300 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-semibold text-gray-900">總金額</span>
                    <span className="text-lg font-bold text-gray-900">
                      NT$ {order.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 付款與狀態 */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                付款與狀態
              </h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* 付款狀態 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    付款狀態
                  </label>
                  {editingPayment ? (
                    <div className="space-y-3">
                      <select
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                        className="form-select"
                        disabled={updateOrderMutation.isPending}
                      >
                        <option value="PENDING">待付款</option>
                        <option value="PAID">已付款</option>
                        <option value="FAILED">付款失敗</option>
                        <option value="REFUNDED">已退款</option>
                        <option value="PARTIAL">部分付款</option>
                      </select>
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <button
                          onClick={handlePaymentStatusUpdate}
                          disabled={updateOrderMutation.isPending || !paymentStatus}
                          className="btn btn-primary btn-sm"
                        >
                          {updateOrderMutation.isPending ? '更新中...' : '確認'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingPayment(false);
                            setPaymentStatus(order.paymentStatus);
                          }}
                          disabled={updateOrderMutation.isPending}
                          className="btn btn-secondary btn-sm"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getPaymentStatusStyle(order.paymentStatus)
                      }`}>
                        {paymentStatusLabels[order.paymentStatus]}
                      </span>
                      <PermissionGate requiredPermissions={['orders.edit']}>
                        <Tooltip content={can('orders.edit') ? '' : '無足夠權限，請聯絡管理員'}>
                          <button
                            onClick={() => setEditingPayment(true)}
                            disabled={!can('orders.edit')}
                            className="btn btn-ghost btn-sm"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </Tooltip>
                      </PermissionGate>
                    </div>
                  )}
                </div>

                {/* 訂單狀態 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    訂單狀態
                  </label>
                  {editingStatus ? (
                    <div className="space-y-3">
                      <select
                        value={orderStatus}
                        onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}
                        className="form-select"
                        disabled={updateOrderMutation.isPending}
                      >
                        <option value="DRAFT">草稿</option>
                        <option value="CONFIRMED">已確認</option>
                        <option value="PROCESSING">處理中</option>
                        <option value="SHIPPED">已出貨</option>
                        <option value="DELIVERED">已送達</option>
                        <option value="CANCELLED">已取消</option>
                      </select>
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <button
                          onClick={handleOrderStatusUpdate}
                          disabled={updateOrderMutation.isPending || !orderStatus}
                          className="btn btn-primary btn-sm"
                        >
                          {updateOrderMutation.isPending ? '更新中...' : '確認'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingStatus(false);
                            setOrderStatus(order.orderStatus);
                          }}
                          disabled={updateOrderMutation.isPending}
                          className="btn btn-secondary btn-sm"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getOrderStatusStyle(order.orderStatus)
                      }`}>
                        {orderStatusLabels[order.orderStatus]}
                      </span>
                      <PermissionGate requiredPermissions={['orders.edit']}>
                        <Tooltip content={can('orders.edit') ? '' : '無足夠權限，請聯絡管理員'}>
                          <button
                            onClick={() => setEditingStatus(true)}
                            disabled={!can('orders.edit')}
                            className="btn btn-ghost btn-sm"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </Tooltip>
                      </PermissionGate>
                    </div>
                  )}
                </div>

                {/* 付款方式 */}
                {order.paymentMethod && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      付款方式
                    </label>
                    <p className="text-gray-900">{order.paymentMethod}</p>
                  </div>
                )}

                {/* 配送方式 */}
                {order.deliveryMethod && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      配送方式
                    </label>
                    <p className="text-gray-900">{order.deliveryMethod}</p>
                  </div>
                )}
              </div>

              {/* 配送地址 */}
              {order.deliveryAddress && (
                <div className="mt-4 sm:mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    配送地址
                  </label>
                  <p className="text-gray-900 break-words">{order.deliveryAddress}</p>
                </div>
              )}

              {/* 備註 */}
              {order.notes && (
                <div className="mt-4 sm:mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    備註
                  </label>
                  <p className="text-gray-900 whitespace-pre-wrap break-words">{order.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右側側邊欄 */}
        <div className="space-y-4 sm:space-y-6">
          {/* 客戶關聯 */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <User className="w-5 h-5 mr-2" />
                客戶關聯
              </h3>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <div>
                  <div className="font-medium text-gray-900">
                    {order?.customerPhoner?.name || '未知客戶'}
                  </div>
                  <div className="text-sm text-gray-500">{order?.customerPhonerPhone || '無電話'}</div>
                  {order?.customerPhoner?.email && (
                    <div className="text-sm text-gray-500">{order?.customerPhoner?.email}</div>
                  )}
                  {order?.customerPhoner?.company && (
                    <div className="text-sm text-gray-500">{order?.customerPhoner?.company}</div>
                  )}
                </div>
                <Link
                  to={`/customers/${order?.customerPhonerPhone || 'unknown'}`}
                  className="btn btn-secondary btn-sm w-full"
                >
                  查看客戶詳情
                </Link>
              </div>
            </div>
          </div>

          {/* 稽核區塊 - 簡化版本，實際應從 Audit API 獲取 */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <ClipboardList className="w-5 h-5 mr-2" />
                最近操作
              </h3>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <div className="border-l-2 border-primary-200 pl-3">
                  <div className="text-sm font-medium text-gray-900">訂單創建</div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(order.createdAt), 'yyyy/MM/dd HH:mm')}
                  </div>
                </div>
                <div className="border-l-2 border-gray-200 pl-3">
                  <div className="text-sm font-medium text-gray-900">最後更新</div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(order.updatedAt), 'yyyy/MM/dd HH:mm')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <confirmDialog.ConfirmDialog />
    </div>
  );
};

export default OrderDetail;