export interface DateRange {
  from?: string;
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

export interface CustomerStats {
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

export interface OrderStats {
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

export interface InteractionStats {
  totalInteractions: number;
  channelDistribution: DistributionItem[];
  typeDistribution: DistributionItem[];
  dailyTrend: DailyTrendItem[];
}

export interface TaskStats {
  totalTasks: number;
  completionRate: number;
  overdueRate: number;
  averageProcessingTime: number;
  statusDistribution: DistributionItem[];
  priorityDistribution: DistributionItem[];
}

// Chart data transformation helpers
export interface ChartData {
  [key: string]: string | number;
}

export interface PieChartData {
  name: string;
  value: number;
  percentage: number;
}

export interface TrendChartData {
  date: string;
  value: number;
  label?: string;
}