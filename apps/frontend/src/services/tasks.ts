import { apiClient } from './api';
import type { ApiResponse, PaginatedResponse, Task } from '@crm/shared';

export interface CreateTaskData {
  customerPhone: string;
  orderId?: string;
  title: string;
  description?: string;
  type: 'FOLLOW_UP' | 'CARE_CALL' | 'REPURCHASE' | 'BIRTHDAY' | 'ANNIVERSARY' | 'PAYMENT_REMINDER' | 'REFUND_PROCESS' | 'OTHER';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueAt: string;
  assigneeUserId?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  type?: 'FOLLOW_UP' | 'CARE_CALL' | 'REPURCHASE' | 'BIRTHDAY' | 'ANNIVERSARY' | 'PAYMENT_REMINDER' | 'REFUND_PROCESS' | 'OTHER';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';
  dueAt?: string;
  assigneeUserId?: string;
}

export interface TaskQueryParams {
  page?: number;
  limit?: number;
  customerPhone?: string;
  assigneeUserId?: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  type?: 'FOLLOW_UP' | 'CARE_CALL' | 'REPURCHASE' | 'BIRTHDAY' | 'ANNIVERSARY' | 'PAYMENT_REMINDER' | 'REFUND_PROCESS' | 'OTHER';
  search?: string;
  dueBefore?: string;
  dueAfter?: string;
  overdue?: boolean;
}

export const tasksService = {
  // Get all tasks with filters
  async getTasks(params?: TaskQueryParams): Promise<PaginatedResponse<Task>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Task>>>('/tasks', {
      params,
    });
    return response.data.data!;
  },

  // Get current user's tasks
  async getMyTasks(limit?: number): Promise<Task[]> {
    const response = await apiClient.get<ApiResponse<Task[]>>('/tasks/my-tasks', {
      params: { limit },
    });
    return response.data.data!;
  },

  // Get task by ID
  async getTask(id: string): Promise<Task> {
    const response = await apiClient.get<ApiResponse<Task>>(`/tasks/${id}`);
    return response.data.data!;
  },

  // Create new task
  async createTask(data: CreateTaskData): Promise<Task> {
    const response = await apiClient.post<ApiResponse<Task>>('/tasks', data);
    return response.data.data!;
  },

  // Update task
  async updateTask(id: string, data: UpdateTaskData): Promise<Task> {
    const response = await apiClient.patch<ApiResponse<Task>>(`/tasks/${id}`, data);
    return response.data.data!;
  },

  // Complete task
  async completeTask(id: string, notes?: string): Promise<Task> {
    const response = await apiClient.post<ApiResponse<Task>>(`/tasks/${id}/complete`, {
      notes,
    });
    return response.data.data!;
  },

  // Delay task
  async delayTask(id: string, newDueAt: string, reason?: string): Promise<Task> {
    const response = await apiClient.post<ApiResponse<Task>>(`/tasks/${id}/delay`, {
      newDueAt,
      reason,
    });
    return response.data.data!;
  },

  // Delete task
  async deleteTask(id: string): Promise<void> {
    await apiClient.delete(`/tasks/${id}`);
  },

  // Get task statistics
  async getTaskStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    byType: Record<string, number>;
    overdue: number;
    dueSoon: number;
  }> {
    const response = await apiClient.get<ApiResponse<any>>('/tasks/stats');
    return response.data.data!;
  },

  // Trigger automation rules
  async triggerAutomation(): Promise<void> {
    await apiClient.post('/tasks/automation/trigger');
  },
};