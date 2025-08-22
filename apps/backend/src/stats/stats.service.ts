import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  CustomerStatsDto,
  OrderStatsDto, 
  InteractionStatsDto,
  TaskStatsDto,
  DateRangeDto
} from './dto/stats.dto';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getCustomerStats(dateRange?: DateRangeDto): Promise<CustomerStatsDto> {
    const { from, to } = this.getDateRange(dateRange);
    
    // 總客戶數
    const totalCustomers = await this.prisma.customer.count({
      where: {
        createdAt: { gte: from, lte: to }
      }
    });

    // 月度新增客戶趨勢 (最近12個月)
    const monthlyTrend = await this.getMonthlyCustomerTrend(from, to);

    // 客戶來源分布
    const sourceDistribution = await this.prisma.customer.groupBy({
      by: ['source'],
      _count: { source: true },
      where: {
        createdAt: { gte: from, lte: to }
      }
    });

    // 客戶城市分布
    const cityDistribution = await this.prisma.customer.groupBy({
      by: ['city'],
      _count: { city: true },
      where: {
        createdAt: { gte: from, lte: to },
        city: { not: null }
      }
    });

    // 客戶狀態分布
    const statusDistribution = await this.prisma.customer.groupBy({
      by: ['status'],
      _count: { status: true },
      where: {
        createdAt: { gte: from, lte: to }
      }
    });

    return {
      totalCustomers,
      monthlyTrend: monthlyTrend.map(item => ({
        month: item.month,
        year: item.year,
        count: item.count,
        date: `${item.year}-${item.month.toString().padStart(2, '0')}`
      })),
      sourceDistribution: sourceDistribution.map(item => ({
        source: item.source,
        count: item._count.source,
        percentage: Math.round((item._count.source / totalCustomers) * 100)
      })),
      cityDistribution: cityDistribution.map(item => ({
        city: item.city,
        count: item._count.city,
        percentage: Math.round((item._count.city / totalCustomers) * 100)
      })),
      statusDistribution: statusDistribution.map(item => ({
        status: item.status,
        count: item._count.status,
        percentage: Math.round((item._count.status / totalCustomers) * 100)
      }))
    };
  }

  async getOrderStats(dateRange?: DateRangeDto): Promise<OrderStatsDto> {
    const { from, to } = this.getDateRange(dateRange);

    // 總訂單數和總金額
    const orderSummary = await this.prisma.order.aggregate({
      _count: true,
      _sum: { totalAmount: true },
      where: {
        createdAt: { gte: from, lte: to }
      }
    });

    // 月度成交金額趨勢
    const monthlyRevenue = await this.getMonthlyRevenueTrend(from, to);

    // 訂單狀態分布
    const statusDistribution = await this.prisma.order.groupBy({
      by: ['status'],
      _count: { status: true },
      _sum: { totalAmount: true },
      where: {
        createdAt: { gte: from, lte: to }
      }
    });

    // 平均訂單金額
    const avgOrderAmount = orderSummary._sum.totalAmount && orderSummary._count > 0
      ? orderSummary._sum.totalAmount / orderSummary._count
      : 0;

    return {
      totalOrders: orderSummary._count,
      totalRevenue: orderSummary._sum.totalAmount || 0,
      averageOrderAmount: Math.round(avgOrderAmount),
      monthlyRevenue: monthlyRevenue.map(item => ({
        month: item.month,
        year: item.year,
        revenue: item.revenue,
        orderCount: item.orderCount,
        date: `${item.year}-${item.month.toString().padStart(2, '0')}`
      })),
      statusDistribution: statusDistribution.map(item => ({
        status: item.status,
        count: item._count.status,
        revenue: item._sum.totalAmount || 0,
        percentage: Math.round((item._count.status / orderSummary._count) * 100)
      }))
    };
  }

  async getInteractionStats(dateRange?: DateRangeDto): Promise<InteractionStatsDto> {
    const { from, to } = this.getDateRange(dateRange);

    // 總交流紀錄數
    const totalInteractions = await this.prisma.interaction.count({
      where: {
        createdAt: { gte: from, lte: to }
      }
    });

    // 溝通管道分布
    const channelDistribution = await this.prisma.interaction.groupBy({
      by: ['channel'],
      _count: { channel: true },
      where: {
        createdAt: { gte: from, lte: to }
      }
    });

    // 每日交流趨勢 (最近30天)
    const dailyTrend = await this.getDailyInteractionTrend(from, to);

    // 交流類型分布
    const typeDistribution = await this.prisma.interaction.groupBy({
      by: ['type'],
      _count: { type: true },
      where: {
        createdAt: { gte: from, lte: to }
      }
    });

    return {
      totalInteractions,
      channelDistribution: channelDistribution.map(item => ({
        channel: item.channel,
        count: item._count.channel,
        percentage: Math.round((item._count.channel / totalInteractions) * 100)
      })),
      typeDistribution: typeDistribution.map(item => ({
        type: item.type,
        count: item._count.type,
        percentage: Math.round((item._count.type / totalInteractions) * 100)
      })),
      dailyTrend: dailyTrend.map(item => ({
        date: item.date.toISOString().split('T')[0],
        count: item.count
      }))
    };
  }

  async getTaskStats(dateRange?: DateRangeDto): Promise<TaskStatsDto> {
    const { from, to } = this.getDateRange(dateRange);

    // 總任務數
    const totalTasks = await this.prisma.task.count({
      where: {
        createdAt: { gte: from, lte: to }
      }
    });

    // 任務狀態分布
    const statusDistribution = await this.prisma.task.groupBy({
      by: ['status'],
      _count: { status: true },
      where: {
        createdAt: { gte: from, lte: to }
      }
    });

    // 完成率計算
    const completedTasks = statusDistribution.find(s => s.status === 'COMPLETED')?._count.status || 0;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 延遲任務統計
    const now = new Date();
    const overdueTasks = await this.prisma.task.count({
      where: {
        createdAt: { gte: from, lte: to },
        dueAt: { lt: now },
        status: { not: 'COMPLETED' }
      }
    });

    const overdueRate = totalTasks > 0 ? Math.round((overdueTasks / totalTasks) * 100) : 0;

    // 任務優先級分布
    const priorityDistribution = await this.prisma.task.groupBy({
      by: ['priority'],
      _count: { priority: true },
      where: {
        createdAt: { gte: from, lte: to }
      }
    });

    // 平均處理時間（完成任務的平均時間）
    const completedTasksWithTime = await this.prisma.task.findMany({
      select: {
        createdAt: true,
        completedAt: true
      },
      where: {
        createdAt: { gte: from, lte: to },
        status: 'COMPLETED',
        completedAt: { not: null }
      }
    });

    const avgProcessingTime = this.calculateAverageProcessingTime(completedTasksWithTime);

    return {
      totalTasks,
      completionRate,
      overdueRate,
      averageProcessingTime: avgProcessingTime,
      statusDistribution: statusDistribution.map(item => ({
        status: item.status,
        count: item._count.status,
        percentage: Math.round((item._count.status / totalTasks) * 100)
      })),
      priorityDistribution: priorityDistribution.map(item => ({
        priority: item.priority,
        count: item._count.priority,
        percentage: Math.round((item._count.priority / totalTasks) * 100)
      }))
    };
  }

  private getDateRange(dateRange?: DateRangeDto): { from: Date; to: Date } {
    if (dateRange?.from && dateRange?.to) {
      return {
        from: new Date(dateRange.from),
        to: new Date(dateRange.to)
      };
    }

    // 預設為最近3個月
    const to = new Date();
    const from = new Date();
    from.setMonth(from.getMonth() - 3);
    
    return { from, to };
  }

  private async getMonthlyCustomerTrend(from: Date, to: Date) {
    // 使用原始 SQL 查詢按月分組
    const result = await this.prisma.$queryRaw<Array<{ month: number; year: number; count: bigint }>>`
      SELECT 
        EXTRACT(MONTH FROM "createdAt") as month,
        EXTRACT(YEAR FROM "createdAt") as year,
        COUNT(*) as count
      FROM "Customer" 
      WHERE "createdAt" >= ${from} AND "createdAt" <= ${to}
      GROUP BY EXTRACT(YEAR FROM "createdAt"), EXTRACT(MONTH FROM "createdAt")
      ORDER BY year, month
    `;

    return result.map(item => ({
      month: Number(item.month),
      year: Number(item.year),
      count: Number(item.count)
    }));
  }

  private async getMonthlyRevenueTrend(from: Date, to: Date) {
    const result = await this.prisma.$queryRaw<Array<{ 
      month: number; 
      year: number; 
      revenue: number;
      orderCount: bigint;
    }>>`
      SELECT 
        EXTRACT(MONTH FROM "createdAt") as month,
        EXTRACT(YEAR FROM "createdAt") as year,
        SUM("totalAmount") as revenue,
        COUNT(*) as "orderCount"
      FROM "Order" 
      WHERE "createdAt" >= ${from} AND "createdAt" <= ${to}
      GROUP BY EXTRACT(YEAR FROM "createdAt"), EXTRACT(MONTH FROM "createdAt")
      ORDER BY year, month
    `;

    return result.map(item => ({
      month: Number(item.month),
      year: Number(item.year),
      revenue: Number(item.revenue) || 0,
      orderCount: Number(item.orderCount)
    }));
  }

  private async getDailyInteractionTrend(from: Date, to: Date) {
    const result = await this.prisma.$queryRaw<Array<{ 
      date: Date; 
      count: bigint;
    }>>`
      SELECT 
        DATE("createdAt") as date,
        COUNT(*) as count
      FROM "Interaction" 
      WHERE "createdAt" >= ${from} AND "createdAt" <= ${to}
      GROUP BY DATE("createdAt")
      ORDER BY date
    `;

    return result.map(item => ({
      date: item.date,
      count: Number(item.count)
    }));
  }

  private calculateAverageProcessingTime(tasks: Array<{ createdAt: Date; completedAt: Date | null }>): number {
    if (tasks.length === 0) return 0;

    const totalHours = tasks.reduce((sum, task) => {
      if (task.completedAt) {
        const diffMs = task.completedAt.getTime() - task.createdAt.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        return sum + diffHours;
      }
      return sum;
    }, 0);

    return Math.round(totalHours / tasks.length * 100) / 100; // 保留2位小數
  }
}