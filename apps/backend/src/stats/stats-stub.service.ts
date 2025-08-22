import { Injectable } from '@nestjs/common';

@Injectable()
export class StatsStubService {
  async getCustomerStats(dateRange?: any) {
    return {
      total: 0,
      newCustomers: 0,
      bySource: []
    };
  }

  async getOrderStats(dateRange?: any) {
    return {
      totalRevenue: '0',
      avgOrderValue: '0',
      count: 0
    };
  }

  async getInteractionStats(dateRange?: any) {
    return {
      count: 0,
      byChannel: []
    };
  }

  async getTaskStats(dateRange?: any) {
    return {
      created: 0,
      completed: 0,
      completionRate: 0
    };
  }
}