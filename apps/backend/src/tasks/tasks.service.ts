import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTaskDto, UpdateTaskDto, TaskQueryDto, CompleteTaskDto, DelayTaskDto, TaskStatus } from './dto/task.dto';
import { Task, PaginatedResponse } from '@crm/shared';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: string, userIp: string): Promise<Task> {
    // Verify customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { phone: createTaskDto.customerPhone }
    });

    if (!customer) {
      throw new BadRequestException(`Customer with phone ${createTaskDto.customerPhone} not found`);
    }

    // Verify order exists if provided
    if (createTaskDto.orderId) {
      const order = await this.prisma.order.findUnique({
        where: { id: createTaskDto.orderId }
      });

      if (!order) {
        throw new BadRequestException(`Order with ID ${createTaskDto.orderId} not found`);
      }
    }

    const task = await this.prisma.task.create({
      data: {
        ...createTaskDto,
        dueAt: new Date(createTaskDto.dueAt),
        assigneeUserId: createTaskDto.assigneeUserId || userId,
        createdByUserId: userId,
      },
      include: {
        customer: {
          select: {
            phone: true,
            name: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            amount: true,
            status: true,
          },
        },
        assigneeUser: {
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
      requestId: `create-task-${Date.now()}`,
      userId,
      userIp,
      action: 'create_task',
      entity: 'Task',
      entityId: task.id,
      changes: createTaskDto,
      status: 'success',
      latencyMs: 0,
    });

    return task;
  }

  async createSystemTask(createTaskDto: Omit<CreateTaskDto, 'assigneeUserId'> & { assigneeUserId?: string }): Promise<Task> {
    // Verify customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { phone: createTaskDto.customerPhone }
    });

    if (!customer) {
      throw new BadRequestException(`Customer with phone ${createTaskDto.customerPhone} not found`);
    }

    // Get a default assignee (e.g., admin or manager) if not specified
    let assigneeUserId = createTaskDto.assigneeUserId;
    if (!assigneeUserId) {
      const defaultAssignee = await this.prisma.user.findFirst({
        where: {
          role: {
            in: ['admin', 'manager'],
          },
          isActive: true,
        },
      });
      assigneeUserId = defaultAssignee?.id;
    }

    const task = await this.prisma.task.create({
      data: {
        ...createTaskDto,
        dueAt: new Date(createTaskDto.dueAt),
        assigneeUserId,
        createdByUserId: null, // System created
        isSystemGenerated: true,
      },
      include: {
        customer: {
          select: {
            phone: true,
            name: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            amount: true,
            status: true,
          },
        },
        assigneeUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log creation (system generated)
    await this.auditService.createLog({
      requestId: `create-system-task-${Date.now()}`,
      userId: 'system',
      userIp: 'internal',
      action: 'create_system_task',
      entity: 'Task',
      entityId: task.id,
      changes: createTaskDto,
      status: 'success',
      latencyMs: 0,
    });

    return task;
  }

  async findAll(query: TaskQueryDto): Promise<PaginatedResponse<Task>> {
    const { 
      page = 1, 
      limit = 20, 
      customerPhone, 
      assigneeUserId, 
      status, 
      priority,
      type,
      search, 
      dueBefore, 
      dueAfter,
      overdue,
    } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (customerPhone) where.customerPhone = customerPhone;
    if (assigneeUserId) where.assigneeUserId = assigneeUserId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (type) where.type = type;
    
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (dueBefore || dueAfter || overdue) {
      where.dueAt = {};
      if (dueBefore) where.dueAt.lte = new Date(dueBefore);
      if (dueAfter) where.dueAt.gte = new Date(dueAfter);
      if (overdue) where.dueAt.lt = new Date();
    }

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: {
          customer: {
            select: {
              phone: true,
              name: true,
              email: true,
            },
          },
          order: {
            select: {
              id: true,
              amount: true,
              status: true,
            },
          },
          assigneeUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { dueAt: 'asc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    // Update overdue tasks
    const now = new Date();
    const overdueTasks = tasks.filter(task => 
      task.dueAt < now && ['PENDING', 'IN_PROGRESS'].includes(task.status)
    );

    if (overdueTasks.length > 0) {
      await this.prisma.task.updateMany({
        where: {
          id: {
            in: overdueTasks.map(t => t.id),
          },
        },
        data: {
          status: TaskStatus.OVERDUE,
        },
      });

      // Update the status in returned data
      overdueTasks.forEach(task => {
        task.status = TaskStatus.OVERDUE;
      });
    }

    return {
      data: tasks,
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

  async findOne(id: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({
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
        order: {
          select: {
            id: true,
            amount: true,
            status: true,
            description: true,
          },
        },
        assigneeUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string, userIp: string): Promise<Task> {
    const existingTask = await this.prisma.task.findUnique({
      where: { id }
    });

    if (!existingTask) {
      throw new NotFoundException('Task not found');
    }

    const task = await this.prisma.task.update({
      where: { id },
      data: {
        ...updateTaskDto,
        dueAt: updateTaskDto.dueAt ? new Date(updateTaskDto.dueAt) : undefined,
      },
      include: {
        customer: {
          select: {
            phone: true,
            name: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            amount: true,
            status: true,
          },
        },
        assigneeUser: {
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
      requestId: `update-task-${Date.now()}`,
      userId,
      userIp,
      action: 'update_task',
      entity: 'Task',
      entityId: id,
      changes: {
        before: existingTask,
        after: updateTaskDto,
      },
      status: 'success',
      latencyMs: 0,
    });

    return task;
  }

  async complete(id: string, completeTaskDto: CompleteTaskDto, userId: string, userIp: string): Promise<Task> {
    const existingTask = await this.prisma.task.findUnique({
      where: { id }
    });

    if (!existingTask) {
      throw new NotFoundException('Task not found');
    }

    if (!['PENDING', 'IN_PROGRESS', 'OVERDUE'].includes(existingTask.status)) {
      throw new BadRequestException('Task cannot be completed from current status');
    }

    const task = await this.prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
        completionNotes: completeTaskDto.notes,
      },
      include: {
        customer: {
          select: {
            phone: true,
            name: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            amount: true,
            status: true,
          },
        },
        assigneeUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log completion
    await this.auditService.createLog({
      requestId: `complete-task-${Date.now()}`,
      userId,
      userIp,
      action: 'complete_task',
      entity: 'Task',
      entityId: id,
      changes: {
        status: 'COMPLETED',
        completedAt: new Date(),
        notes: completeTaskDto.notes,
      },
      status: 'success',
      latencyMs: 0,
    });

    return task;
  }

  async delay(id: string, delayTaskDto: DelayTaskDto, userId: string, userIp: string): Promise<Task> {
    const existingTask = await this.prisma.task.findUnique({
      where: { id }
    });

    if (!existingTask) {
      throw new NotFoundException('Task not found');
    }

    if (!['PENDING', 'IN_PROGRESS', 'OVERDUE'].includes(existingTask.status)) {
      throw new BadRequestException('Task cannot be delayed from current status');
    }

    const newDueDate = new Date(delayTaskDto.newDueAt);
    if (newDueDate <= new Date()) {
      throw new BadRequestException('New due date must be in the future');
    }

    const task = await this.prisma.task.update({
      where: { id },
      data: {
        dueAt: newDueDate,
        status: TaskStatus.PENDING, // Reset to pending if was overdue
        delayReason: delayTaskDto.reason,
      },
      include: {
        customer: {
          select: {
            phone: true,
            name: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            amount: true,
            status: true,
          },
        },
        assigneeUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log delay
    await this.auditService.createLog({
      requestId: `delay-task-${Date.now()}`,
      userId,
      userIp,
      action: 'delay_task',
      entity: 'Task',
      entityId: id,
      changes: {
        originalDueAt: existingTask.dueAt,
        newDueAt: newDueDate,
        reason: delayTaskDto.reason,
      },
      status: 'success',
      latencyMs: 0,
    });

    return task;
  }

  async remove(id: string, userId: string, userIp: string): Promise<void> {
    const existingTask = await this.prisma.task.findUnique({
      where: { id }
    });

    if (!existingTask) {
      throw new NotFoundException('Task not found');
    }

    await this.prisma.task.delete({
      where: { id }
    });

    // Log deletion
    await this.auditService.createLog({
      requestId: `delete-task-${Date.now()}`,
      userId,
      userIp,
      action: 'delete_task',
      entity: 'Task',
      entityId: id,
      changes: { deletedTask: existingTask },
      status: 'success',
      latencyMs: 0,
    });
  }

  async getTaskStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    byType: Record<string, number>;
    overdue: number;
    dueSoon: number;
  }> {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const [
      total,
      statusStats,
      priorityStats,
      typeStats,
      overdue,
      dueSoon,
    ] = await Promise.all([
      this.prisma.task.count(),
      this.prisma.task.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.task.groupBy({
        by: ['priority'],
        _count: { _all: true },
      }),
      this.prisma.task.groupBy({
        by: ['type'],
        _count: { _all: true },
      }),
      this.prisma.task.count({
        where: {
          status: {
            in: ['PENDING', 'IN_PROGRESS'],
          },
          dueAt: {
            lt: now,
          },
        },
      }),
      this.prisma.task.count({
        where: {
          status: {
            in: ['PENDING', 'IN_PROGRESS'],
          },
          dueAt: {
            gte: now,
            lte: tomorrow,
          },
        },
      }),
    ]);

    const byStatus: Record<string, number> = {};
    statusStats.forEach(stat => {
      byStatus[stat.status] = stat._count._all;
    });

    const byPriority: Record<string, number> = {};
    priorityStats.forEach(stat => {
      byPriority[stat.priority] = stat._count._all;
    });

    const byType: Record<string, number> = {};
    typeStats.forEach(stat => {
      byType[stat.type] = stat._count._all;
    });

    return {
      total,
      byStatus,
      byPriority,
      byType,
      overdue,
      dueSoon,
    };
  }

  async getUserTasks(userId: string, limit: number = 10): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: { 
        assigneeUserId: userId,
        status: {
          in: ['PENDING', 'IN_PROGRESS', 'OVERDUE'],
        },
      },
      include: {
        customer: {
          select: {
            phone: true,
            name: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            amount: true,
            status: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { dueAt: 'asc' },
      ],
      take: limit,
    });
  }
}