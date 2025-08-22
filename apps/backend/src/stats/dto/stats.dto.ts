import { IsOptional, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class DateRangeDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

export interface MonthlyTrendItem {
  month: number;
  year: number;
  count: number;
  date: string;
}

export interface DistributionItem {
  source?: string;
  city?: string;
  status?: string;
  channel?: string;
  type?: string;
  priority?: string;
  count: number;
  percentage: number;
}

export interface CustomerStatsDto {
  totalCustomers: number;
  monthlyTrend: MonthlyTrendItem[];
  sourceDistribution: DistributionItem[];
  cityDistribution: DistributionItem[];
  statusDistribution: DistributionItem[];
}

export interface MonthlyRevenueItem {
  month: number;
  year: number;
  revenue: number;
  orderCount: number;
  date: string;
}

export interface OrderStatusItem {
  status: string;
  count: number;
  revenue: number;
  percentage: number;
}

export interface OrderStatsDto {
  totalOrders: number;
  totalRevenue: number;
  averageOrderAmount: number;
  monthlyRevenue: MonthlyRevenueItem[];
  statusDistribution: OrderStatusItem[];
}

export interface DailyTrendItem {
  date: string;
  count: number;
}

export interface InteractionStatsDto {
  totalInteractions: number;
  channelDistribution: DistributionItem[];
  typeDistribution: DistributionItem[];
  dailyTrend: DailyTrendItem[];
}

export interface TaskStatsDto {
  totalTasks: number;
  completionRate: number;
  overdueRate: number;
  averageProcessingTime: number;
  statusDistribution: DistributionItem[];
  priorityDistribution: DistributionItem[];
}