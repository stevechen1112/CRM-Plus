import { apiClient } from './api';
import type { ApiResponse, PaginatedResponse, Interaction } from '@crm/shared';

export interface CreateInteractionData {
  customerPhone: string;
  channel: 'PHONE' | 'EMAIL' | 'LINE' | 'FACEBOOK' | 'MEETING' | 'OTHER';
  summary: string;
  note?: string;
  attachments?: string[];
}

export interface UpdateInteractionData {
  channel?: 'PHONE' | 'EMAIL' | 'LINE' | 'FACEBOOK' | 'MEETING' | 'OTHER';
  summary?: string;
  note?: string;
  attachments?: string[];
}

export interface InteractionQueryParams {
  page?: number;
  limit?: number;
  customerPhone?: string;
  channel?: string;
  userId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export const interactionsService = {
  // Get all interactions with filters
  async getInteractions(params?: InteractionQueryParams): Promise<PaginatedResponse<Interaction>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Interaction>>>('/interactions', {
      params,
    });
    return response.data.data!;
  },

  // Get interaction by ID
  async getInteraction(id: string): Promise<Interaction> {
    const response = await apiClient.get<ApiResponse<Interaction>>(`/interactions/${id}`);
    return response.data.data!;
  },

  // Get customer interactions
  async getCustomerInteractions(customerPhone: string, limit?: number): Promise<Interaction[]> {
    const response = await apiClient.get<ApiResponse<Interaction[]>>(
      `/interactions/customer/${customerPhone}`,
      { params: { limit } }
    );
    return response.data.data!;
  },

  // Create new interaction
  async createInteraction(data: CreateInteractionData): Promise<Interaction> {
    const response = await apiClient.post<ApiResponse<Interaction>>('/interactions', data);
    return response.data.data!;
  },

  // Update interaction
  async updateInteraction(id: string, data: UpdateInteractionData): Promise<Interaction> {
    const response = await apiClient.patch<ApiResponse<Interaction>>(`/interactions/${id}`, data);
    return response.data.data!;
  },

  // Delete interaction
  async deleteInteraction(id: string): Promise<void> {
    await apiClient.delete(`/interactions/${id}`);
  },

  // Get interaction statistics
  async getInteractionStats(): Promise<{
    total: number;
    byChannel: Record<string, number>;
    recentInteractions: number;
    averagePerCustomer: number;
  }> {
    const response = await apiClient.get<ApiResponse<any>>('/interactions/stats');
    return response.data.data!;
  },
};