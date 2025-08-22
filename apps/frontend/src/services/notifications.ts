import { apiClient } from './api';
import type { ApiResponse } from '@crm/shared';

export interface Notification {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  data?: any;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

export const notificationsService = {
  // Get current user's notifications
  async getNotifications(limit?: number): Promise<Notification[]> {
    const response = await apiClient.get<ApiResponse<Notification[]>>('/notifications', {
      params: { limit },
    });
    return response.data.data!;
  },

  // Get unread notification count
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
    return response.data.data!.count;
  },

  // Mark notification as read
  async markAsRead(id: string): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    await apiClient.post('/notifications/mark-all-read');
  },
};