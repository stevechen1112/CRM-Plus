import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateOrderDto, UpdateOrderDto, OrderQueryDto } from './dto/order.dto';
import { Order, PaginatedResponse } from '@crm/shared';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(createOrderDto: CreateOrderDto, userId: string, userIp: string): Promise<Order> {
    // Verify customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { phone: createOrderDto.customerPhone }
    });

    if (!customer) {
      throw new BadRequestException(`Customer with phone ${createOrderDto.customerPhone} not found`);
    }

    const order = await this.prisma.order.create({
      data: {
        ...createOrderDto,
        expectedDeliveryDate: createOrderDto.expectedDeliveryDate 
          ? new Date(createOrderDto.expectedDeliveryDate) 
          : undefined,
      },
      include: {
        customer: {
          select: {
            phone: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log creation
    await this.auditService.createLog({
      requestId: `create-order-${Date.now()}`,
      userId,
      userIp,
      action: 'create_order',
      entity: 'Order',
      entityId: order.id,
      changes: createOrderDto,
      status: 'success',
      latencyMs: 0,
    });

    return order;
  }

  async findAll(query: OrderQueryDto): Promise<PaginatedResponse<Order>> {
    const { 
      page = 1, 
      limit = 20, 
      customerPhone, 
      status, 
      search, 
      startDate, 
      endDate,
      minAmount,
      maxAmount,
    } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (customerPhone) where.customerPhone = customerPhone;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { description: { contains: search } },
        { notes: { contains: search } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      where.amount = {};
      if (minAmount !== undefined) where.amount.gte = minAmount;
      if (maxAmount !== undefined) where.amount.lte = maxAmount;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          customer: {
            select: {
              phone: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
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

  async findOne(id: string): Promise<Order> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            phone: true,
            name: true,
            email: true,
            company: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto, userId: string, userIp: string): Promise<Order> {
    const existingOrder = await this.prisma.order.findUnique({
      where: { id }
    });

    if (!existingOrder) {
      throw new NotFoundException('Order not found');
    }

    const order = await this.prisma.order.update({
      where: { id },
      data: {
        ...updateOrderDto,
        expectedDeliveryDate: updateOrderDto.expectedDeliveryDate 
          ? new Date(updateOrderDto.expectedDeliveryDate) 
          : undefined,
      },
      include: {
        customer: {
          select: {
            phone: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log update
    await this.auditService.createLog({
      requestId: `update-order-${Date.now()}`,
      userId,
      userIp,
      action: 'update_order',
      entity: 'Order',
      entityId: id,
      changes: {
        before: existingOrder,
        after: updateOrderDto,
      },
      status: 'success',
      latencyMs: 0,
    });

    return order;
  }

  async remove(id: string, userId: string, userIp: string): Promise<void> {
    const existingOrder = await this.prisma.order.findUnique({
      where: { id }
    });

    if (!existingOrder) {
      throw new NotFoundException('Order not found');
    }

    await this.prisma.order.delete({
      where: { id }
    });

    // Log deletion
    await this.auditService.createLog({
      requestId: `delete-order-${Date.now()}`,
      userId,
      userIp,
      action: 'delete_order',
      entity: 'Order',
      entityId: id,
      changes: { deletedOrder: existingOrder },
      status: 'success',
      latencyMs: 0,
    });
  }

  async getOrderStats(): Promise<{
    total: number;
    totalAmount: number;
    byStatus: Record<string, number>;
    recentOrders: number;
    averageOrderAmount: number;
  }> {
    const [
      total,
      totalAmountResult,
      statusStats,
      recentOrders,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.aggregate({
        _sum: { amount: true },
        _avg: { amount: true },
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
    ]);

    const byStatus: Record<string, number> = {};
    statusStats.forEach(stat => {
      byStatus[stat.status] = stat._count._all;
    });

    return {
      total,
      totalAmount: totalAmountResult._sum.amount || 0,
      byStatus,
      recentOrders,
      averageOrderAmount: totalAmountResult._avg.amount || 0,
    };
  }

  async getCustomerOrders(customerPhone: string, limit: number = 10): Promise<Order[]> {
    return this.prisma.order.findMany({
      where: { customerPhone },
      include: {
        customer: {
          select: {
            phone: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}