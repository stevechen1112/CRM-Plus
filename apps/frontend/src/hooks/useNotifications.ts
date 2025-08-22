import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { notificationsService } from '@/services/notifications';

// Get notifications
export const useNotifications = (limit?: number) => {
  return useQuery({
    queryKey: ['notifications', limit],
    queryFn: () => notificationsService.getNotifications(limit),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 1000 * 30, // 30 seconds
  });
};

// Get unread count
export const useUnreadCount = () => {
  return useQuery({
    queryKey: ['unreadCount'],
    queryFn: () => notificationsService.getUnreadCount(),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 1000 * 30, // 30 seconds
  });
};

// Mark notification as read
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
    onError: () => {
      toast.error('標記通知失敗');
    },
  });
};

// Mark all as read
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => {
      toast.success('已標記所有通知為已讀');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
    onError: () => {
      toast.error('標記通知失敗');
    },
  });
};