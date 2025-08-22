import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SimpleJwtAuthGuard } from '../auth/guards/simple-jwt-auth.guard';

@Controller('stats')
@UseGuards(SimpleJwtAuthGuard)
export class StatsSimpleController {
  @Get('customers')
  async getCustomerStats(@Query() dateRange: any) {
    return {
      total: 0,
      newCustomers: 0,
      monthlyTrend: [],
      sourceDistribution: [],
      cityDistribution: []
    };
  }

  @Get('orders')
  async getOrderStats(@Query() dateRange: any) {
    return {
      totalRevenue: '0',
      avgOrderValue: '0',
      count: 0,
      monthlyRevenue: []
    };
  }

  @Get('interactions')
  async getInteractionStats(@Query() dateRange: any) {
    return {
      count: 0,
      channelDistribution: [],
      dailyTrend: []
    };
  }

  @Get('tasks')
  async getTaskStats(@Query() dateRange: any) {
    return {
      created: 0,
      completed: 0,
      completionRate: 0,
      statusDistribution: []
    };
  }
}