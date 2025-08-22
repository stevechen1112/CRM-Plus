import { AxiosResponse } from 'axios';
import apiClient from './api';
import type { 
  Order, 
  PaginatedResponse, 
  CreateOrderRequest, 
  UpdateOrderRequest
} from '@crm/shared';

// 重新導出類型供其他模組使用
export type { PaymentStatus, OrderStatus } from '@crm/shared';

export interface OrdersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  orderNo?: string;
  customerPhone?: string;
  paymentStatus?: string;
  orderStatus?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface OrderWithCustomer extends Order {
  customer?: {
    phone: string;
    name: string;
    email?: string;
    company?: string;
  };
}

// API 服務
export const ordersService = {
  // 獲取訂單列表
  async getOrders(params?: OrdersQueryParams): Promise<PaginatedResponse<OrderWithCustomer>> {
    const response: AxiosResponse<PaginatedResponse<OrderWithCustomer>> = await apiClient.get('/orders', { params });
    return response.data;
  },

  // 獲取單一訂單詳情
  async getOrder(id: string): Promise<OrderWithCustomer> {
    const response: AxiosResponse<OrderWithCustomer> = await apiClient.get(`/orders/${id}`);
    return response.data;
  },

  // 創建訂單
  async createOrder(data: CreateOrderRequest): Promise<OrderWithCustomer> {
    const response: AxiosResponse<OrderWithCustomer> = await apiClient.post('/orders', data);
    return response.data;
  },

  // 更新訂單
  async updateOrder(id: string, data: UpdateOrderRequest): Promise<OrderWithCustomer> {
    const response: AxiosResponse<OrderWithCustomer> = await apiClient.patch(`/orders/${id}`, data);
    return response.data;
  },

  // 刪除訂單
  async deleteOrder(id: string): Promise<void> {
    await apiClient.delete(`/orders/${id}`);
  },

  // 獲取訂單統計
  async getOrderStats(): Promise<{
    total: number;
    totalAmount: number;
    byStatus: Record<string, number>;
    recentOrders: number;
    averageOrderAmount: number;
  }> {
    const response = await apiClient.get('/orders/stats');
    return response.data;
  },

  // 獲取客戶的訂單記錄
  async getCustomerOrders(customerPhone: string, limit: number = 10): Promise<OrderWithCustomer[]> {
    const response: AxiosResponse<OrderWithCustomer[]> = await apiClient.get('/orders/customer', {
      params: { customerPhone, limit }
    });
    return response.data;
  },

  // 匯出訂單
  async exportOrders(params?: OrdersQueryParams): Promise<void> {
    const response = await apiClient.get('/orders/export', {
      params,
      responseType: 'blob',
    });
    
    // 建立下載連結
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};

export default ordersService;