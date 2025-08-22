import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersService, OrdersQueryParams, OrderWithCustomer } from '@/services/orders';
import { CreateOrderRequest, UpdateOrderRequest, PaginatedResponse } from '@crm/shared';
import { useSuccessToast, useErrorToast } from '@/components/common/Toast';

// 查詢 hooks
export const useOrders = (params?: OrdersQueryParams) => {
  return useQuery<PaginatedResponse<OrderWithCustomer>>({
    queryKey: ['orders', params],
    queryFn: () => ordersService.getOrders(params),
    staleTime: 5 * 60 * 1000, // 5 分鐘
  });
};

export const useOrder = (id: string) => {
  return useQuery<OrderWithCustomer>({
    queryKey: ['orders', id],
    queryFn: () => ordersService.getOrder(id),
    enabled: !!id,
  });
};

export const useOrderStats = () => {
  return useQuery({
    queryKey: ['orders', 'stats'],
    queryFn: ordersService.getOrderStats,
    staleTime: 10 * 60 * 1000, // 10 分鐘
  });
};

export const useCustomerOrders = (customerPhone: string, limit: number = 10) => {
  return useQuery<OrderWithCustomer[]>({
    queryKey: ['orders', 'customer', customerPhone, limit],
    queryFn: () => ordersService.getCustomerOrders(customerPhone, limit),
    enabled: !!customerPhone,
  });
};

// 變更 hooks
export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const successToast = useSuccessToast();
  const errorToast = useErrorToast();

  return useMutation({
    mutationFn: (data: CreateOrderRequest) => ordersService.createOrder(data),
    onSuccess: (data) => {
      // 更新相關查詢
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      
      successToast(`訂單 ${data.orderNo} 創建成功`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '創建訂單失敗';
      errorToast(message);
    },
  });
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();
  const successToast = useSuccessToast();
  const errorToast = useErrorToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrderRequest }) => 
      ordersService.updateOrder(id, data),
    onSuccess: (data, variables) => {
      // 更新特定訂單查詢
      queryClient.setQueryData(['orders', variables.id], data);
      
      // 使相關查詢失效
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      
      successToast(`訂單 ${data.orderNo} 更新成功`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '更新訂單失敗';
      errorToast(message);
    },
  });
};

export const useDeleteOrder = () => {
  const queryClient = useQueryClient();
  const successToast = useSuccessToast();
  const errorToast = useErrorToast();

  return useMutation({
    mutationFn: (id: string) => ordersService.deleteOrder(id),
    onSuccess: (_, id) => {
      // 移除特定訂單查詢
      queryClient.removeQueries({ queryKey: ['orders', id] });
      
      // 使相關查詢失效
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      
      successToast('訂單刪除成功');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '刪除訂單失敗';
      errorToast(message);
    },
  });
};

export const useOrderExport = () => {
  const successToast = useSuccessToast();
  const errorToast = useErrorToast();

  return useMutation({
    mutationFn: (params?: OrdersQueryParams) => ordersService.exportOrders(params),
    onSuccess: () => {
      successToast('訂單資料匯出成功');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '匯出失敗';
      errorToast(message);
    },
  });
};