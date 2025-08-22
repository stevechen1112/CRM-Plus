import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateInteractionDto, UpdateInteractionDto, InteractionQueryDto } from './dto/interaction.dto';
import { Interaction, PaginatedResponse } from '@crm/shared';

@Injectable()
export class InteractionsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(createInteractionDto: CreateInteractionDto, userId: string, userIp: string): Promise<Interaction> {
    // Verify customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { phone: createInteractionDto.customerPhone }
    });

    if (!customer) {
      throw new BadRequestException(`Customer with phone ${createInteractionDto.customerPhone} not found`);
    }

    const interaction = await this.prisma.interaction.create({
      data: {
        customerPhone: createInteractionDto.customerPhone,
        channel: createInteractionDto.channel as any,
        summary: createInteractionDto.summary,
        notes: createInteractionDto.notes,
        attachments: createInteractionDto.attachments,
        userId,
      },
      include: {
        customer: {
          select: {
            phone: true,
            name: true,
            email: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log creation
    await this.auditService.createLog({
      requestId: `create-interaction-${Date.now()}`,
      userId,
      userIp,
      action: 'create_interaction',
      entity: 'Interaction',
      entityId: interaction.id,
      changes: createInteractionDto,
      status: 'success',
      latencyMs: 0,
    });

    return interaction;
  }

  async findAll(query: InteractionQueryDto): Promise<PaginatedResponse<Interaction>> {
    const { 
      page = 1, 
      limit = 20, 
      customerPhone, 
      channel, 
      userId,
      search, 
      startDate, 
      endDate,
    } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (customerPhone) where.customerPhone = customerPhone;
    if (channel) where.channel = channel;
    if (userId) where.userId = userId;
    
    if (search) {
      where.OR = [
        { summary: { contains: search } },
        { notes: { contains: search } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [interactions, total] = await Promise.all([
      this.prisma.interaction.findMany({
        where,
        include: {
          customer: {
            select: {
              phone: true,
              name: true,
              email: true,
            },
          },
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
      this.prisma.interaction.count({ where }),
    ]);

    return {
      data: interactions,
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

  async findOne(id: string): Promise<Interaction> {
    const interaction = await this.prisma.interaction.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            phone: true,
            name: true,
            email: true,
            // company field doesn't exist in Customer model
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!interaction) {
      throw new NotFoundException('Interaction not found');
    }

    return interaction;
  }

  async update(id: string, updateInteractionDto: UpdateInteractionDto, userId: string, userIp: string): Promise<Interaction> {
    const existingInteraction = await this.prisma.interaction.findUnique({
      where: { id }
    });

    if (!existingInteraction) {
      throw new NotFoundException('Interaction not found');
    }

    const interaction = await this.prisma.interaction.update({
      where: { id },
      data: {
        ...(updateInteractionDto.channel && { channel: updateInteractionDto.channel as any }),
        ...(updateInteractionDto.summary && { summary: updateInteractionDto.summary }),
        ...(updateInteractionDto.notes !== undefined && { notes: updateInteractionDto.notes }),
        ...(updateInteractionDto.attachments !== undefined && { attachments: updateInteractionDto.attachments }),
      },
      include: {
        customer: {
          select: {
            phone: true,
            name: true,
            email: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log update
    await this.auditService.createLog({
      requestId: `update-interaction-${Date.now()}`,
      userId,
      userIp,
      action: 'update_interaction',
      entity: 'Interaction',
      entityId: id,
      changes: {
        before: existingInteraction,
        after: updateInteractionDto,
      },
      status: 'success',
      latencyMs: 0,
    });

    return interaction;
  }

  async remove(id: string, userId: string, userIp: string): Promise<void> {
    const existingInteraction = await this.prisma.interaction.findUnique({
      where: { id }
    });

    if (!existingInteraction) {
      throw new NotFoundException('Interaction not found');
    }

    await this.prisma.interaction.delete({
      where: { id }
    });

    // Log deletion
    await this.auditService.createLog({
      requestId: `delete-interaction-${Date.now()}`,
      userId,
      userIp,
      action: 'delete_interaction',
      entity: 'Interaction',
      entityId: id,
      changes: { deletedInteraction: existingInteraction },
      status: 'success',
      latencyMs: 0,
    });
  }

  async getCustomerInteractions(customerPhone: string, limit: number = 10): Promise<Interaction[]> {
    return this.prisma.interaction.findMany({
      where: { customerPhone },
      include: {
        customer: {
          select: {
            phone: true,
            name: true,
            email: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getInteractionStats(): Promise<{
    total: number;
    byChannel: Record<string, number>;
    recentInteractions: number;
    averagePerCustomer: number;
  }> {
    const [
      total,
      channelStats,
      recentInteractions,
      uniqueCustomers,
    ] = await Promise.all([
      this.prisma.interaction.count(),
      this.prisma.interaction.groupBy({
        by: ['channel'],
        _count: { _all: true },
      }),
      this.prisma.interaction.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
      this.prisma.interaction.groupBy({
        by: ['customerPhone'],
        _count: { _all: true },
      }),
    ]);

    const byChannel: Record<string, number> = {};
    channelStats.forEach(stat => {
      byChannel[stat.channel] = stat._count._all;
    });

    return {
      total,
      byChannel,
      recentInteractions,
      averagePerCustomer: uniqueCustomers.length > 0 ? total / uniqueCustomers.length : 0,
    };
  }
}