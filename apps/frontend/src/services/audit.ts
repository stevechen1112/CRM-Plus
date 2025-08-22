import { apiClient } from './api';
import { AuditLog, ApiResponse } from '@crm/shared';

export interface AuditQuery {
  startDate?: string;
  endDate?: string;
  userId?: string;
  action?: string;
  entity?: string;
  status?: 'success' | 'error';
  page?: number;
  limit?: number;
}

export interface AuditListResponse {
  auditLogs: (AuditLog & { user: { email: string; name: string; role: string } })[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class AuditService {
  async getAuditLogs(params: AuditQuery = {}): Promise<AuditListResponse> {
    const response = await apiClient.get<ApiResponse<AuditListResponse>>('/audit', { params });
    if (!response.data.data) {
      throw new Error('No audit data received');
    }
    return response.data.data;
  }

  async exportAuditLogs(params: AuditQuery = {}): Promise<Blob> {
    const response = await apiClient.get('/audit/export', {
      params: { ...params, format: 'csv' },
      responseType: 'blob',
    });
    return response.data;
  }
}

export const auditService = new AuditService();