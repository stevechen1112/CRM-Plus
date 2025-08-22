import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications';
import type { Notification } from '@/services/notifications';

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { data: notifications = [], isLoading } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadCount();
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsReadMutation.mutateAsync(notification.id);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsReadMutation.mutateAsync();
  };

  const getNotificationIcon = (_type: string, priority: string) => {
    if (priority === 'HIGH' || priority === 'URGENT') {
      return <AlertTriangle className="w-4 h-4 text-error-500" />;
    }
    return <Clock className="w-4 h-4 text-primary-500" />;
  };

  const getNotificationBgColor = (notification: Notification) => {
    if (!notification.isRead) {
      return 'bg-primary-50 border-l-4 border-l-primary-500';
    }
    return 'bg-white hover:bg-gray-50';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-full"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-error-500 text-xs font-medium text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">通知中心</h3>
              {unreadCount > 0 && (
                <span className="badge badge-error">{unreadCount}</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markAllAsReadMutation.isLoading}
                className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700"
              >
                <CheckCheck className="w-4 h-4" />
                <span>全部標記已讀</span>
              </button>
            )}
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="spinner w-6 h-6"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <Bell className="w-12 h-12 text-gray-300 mb-2" />
                <p className="text-sm">暫無通知</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 cursor-pointer transition-colors ${getNotificationBgColor(
                      notification
                    )}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type, notification.priority)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 ml-2" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {format(new Date(notification.createdAt), 'MM/dd HH:mm')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full text-sm text-center text-primary-600 hover:text-primary-700 font-medium"
              >
                查看所有通知
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};