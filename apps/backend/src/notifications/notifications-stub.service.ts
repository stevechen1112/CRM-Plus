import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationsStubService {
  // 獲取用戶的站內通知 - 暫時返回空陣列
  async getInAppNotifications(userId: string, limit: number = 50) {
    return [];
  }

  // 獲取未讀通知數量 - 暫時返回 0
  async getUnreadNotificationCount(userId: string): Promise<number> {
    return 0;
  }

  // 標記通知為已讀 - 暫時 stub
  async markNotificationAsRead(notificationId: string, userId: string) {
    return { count: 1 };
  }

  // 標記所有通知為已讀 - 暫時 stub
  async markAllNotificationsAsRead(userId: string) {
    return { count: 0 };
  }
}