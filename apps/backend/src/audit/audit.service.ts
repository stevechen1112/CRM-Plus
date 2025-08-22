import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { AuditLog } from '@crm/shared';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async createLog({
    requestId,
    userId,
    userRole,
    userIp,
    action,
    entity,
    entityId,
    changes,
    status,
    latencyMs,
  }: {
    requestId: string;
    userId: string;
    userRole?: string;
    userIp: string;
    action: string;
    entity: string;
    entityId: string;
    changes?: Record<string, any>;
    status: 'success' | 'error';
    latencyMs: number;
  }) {
    return this.prisma.auditLog.create({
      data: {
        requestId,
        userId,
        userRole: (userRole || 'STAFF') as any,
        userIp,
        action,
        entity,
        entityId,
        changes,
        status: status === 'success' ? 'SUCCESS' : 'ERROR',
        latencyMs,
      },
    });
  }

  async getLogs({
    page = 1,
    limit = 20,
    userId,
    action,
    entity,
    startDate,
    endDate,
  }: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    entity?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (userId) where.userId = userId;
    if (action) where.action = { contains: action };
    if (entity) where.entity = entity;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async getLoginLogs({
    page = 1,
    limit = 20,
    userId,
    startDate,
    endDate,
  }: {
    page?: number;
    limit?: number;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    return this.getLogs({
      page,
      limit,
      userId,
      action: 'login',
      startDate,
      endDate,
    });
  }
}