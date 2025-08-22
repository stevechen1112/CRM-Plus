import { apiClient as api } from './api';
import type {
  CustomerStats,
  OrderStats,
  InteractionStats,
  TaskStats,
  DateRange
} from '@/types/stats';

export const statsService = {
  getCustomerStats: async (dateRange?: DateRange): Promise<CustomerStats> => {
    const params = new URLSearchParams();
    if (dateRange?.from) params.append('from', dateRange.from);
    if (dateRange?.to) params.append('to', dateRange.to);
    
    const response = await api.get(`/stats/customers?${params.toString()}`);
    return response.data;
  },

  getOrderStats: async (dateRange?: DateRange): Promise<OrderStats> => {
    const params = new URLSearchParams();
    if (dateRange?.from) params.append('from', dateRange.from);
    if (dateRange?.to) params.append('to', dateRange.to);
    
    const response = await api.get(`/stats/orders?${params.toString()}`);
    return response.data;
  },

  getInteractionStats: async (dateRange?: DateRange): Promise<InteractionStats> => {
    const params = new URLSearchParams();
    if (dateRange?.from) params.append('from', dateRange.from);
    if (dateRange?.to) params.append('to', dateRange.to);
    
    const response = await api.get(`/stats/interactions?${params.toString()}`);
    return response.data;
  },

  getTaskStats: async (dateRange?: DateRange): Promise<TaskStats> => {
    const params = new URLSearchParams();
    if (dateRange?.from) params.append('from', dateRange.from);
    if (dateRange?.to) params.append('to', dateRange.to);
    
    const response = await api.get(`/stats/tasks?${params.toString()}`);
    return response.data;
  }
};