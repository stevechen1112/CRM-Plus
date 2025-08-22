import { apiClient } from './api';
import { User, UserRole, ApiResponse } from '@crm/shared';

export interface UsersQuery {
  query?: string;
  page?: number;
  limit?: number;
  role?: UserRole;
  isActive?: boolean;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface ResetPasswordRequest {
  newPassword: string;
}

export interface UsersListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class UsersService {
  async getUsers(params: UsersQuery = {}): Promise<UsersListResponse> {
    const response = await apiClient.get<ApiResponse<UsersListResponse>>('/users', { params });
    if (!response.data.data) {
      throw new Error('No users data received');
    }
    return response.data.data;
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    const response = await apiClient.post<ApiResponse<User>>('/users', userData);
    if (!response.data.data) {
      throw new Error('No user data received');
    }
    return response.data.data;
  }

  async getUserById(id: string): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    if (!response.data.data) {
      throw new Error('No user data received');
    }
    return response.data.data;
  }

  async updateUser(id: string, userData: UpdateUserRequest): Promise<User> {
    const response = await apiClient.patch<ApiResponse<User>>(`/users/${id}`, userData);
    if (!response.data.data) {
      throw new Error('No user data received');
    }
    return response.data.data;
  }

  async resetPassword(id: string, newPassword: string): Promise<void> {
    await apiClient.patch(`/users/${id}/password`, { newPassword });
  }

  async revokeAllSessions(id: string): Promise<void> {
    await apiClient.post(`/users/${id}/revoke-sessions`);
  }

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  }
}

export const usersService = new UsersService();