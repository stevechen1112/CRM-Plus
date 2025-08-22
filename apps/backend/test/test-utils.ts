import { Test } from '@nestjs/testing';
import { PrismaService } from '../src/common/services/prisma.service';
import { CustomersService } from '../src/customers/customers.service';
import { OrdersService } from '../src/orders/orders.service';
import { InteractionsService } from '../src/interactions/interactions.service';
import { TasksService } from '../src/tasks/tasks.service';
import { UserRole } from '@crm/shared';

export const createTestingModule = async (providers: any[] = []) => {
  const module = await Test.createTestingModule({
    providers: [
      PrismaService,
      ...providers,
    ],
  }).compile();

  return module;
};

export const createTestUser = async (prisma: PrismaService, role: UserRole = 'STAFF') => {
  return await prisma.user.create({
    data: {
      name: `Test User ${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      password: 'hashedpassword',
      role,
      isActive: true,
    },
  });
};

export const createTestCustomer = async (prisma: PrismaService, phone?: string) => {
  return await prisma.customer.create({
    data: {
      phone: phone || `09${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
      name: `測試客戶${Date.now()}`,
      email: `customer${Date.now()}@example.com`,
      tags: ['測試'],
      marketingConsent: true,
    },
  });
};

export const createTestOrder = async (prisma: PrismaService, customerPhone: string, totalAmount: number = 1000) => {
  return await prisma.order.create({
    data: {
      orderNo: `ORD${Date.now()}`,
      customerPhone,
      totalAmount,
      paymentStatus: 'PENDING',
      orderStatus: 'CONFIRMED',
      items: {
        create: [
          {
            productName: '測試商品',
            quantity: 1,
            unitPrice: totalAmount,
            totalPrice: totalAmount,
          },
        ],
      },
    },
    include: {
      items: true,
    },
  });
};

export const createTestInteraction = async (prisma: PrismaService, customerPhone: string, userId: string) => {
  return await prisma.interaction.create({
    data: {
      customerPhone,
      userId,
      channel: 'PHONE',
      summary: '測試互動',
      notes: '測試內容',
    },
  });
};

export const createTestTask = async (prisma: PrismaService, customerPhone: string, userId: string) => {
  return await prisma.task.create({
    data: {
      customerPhone,
      assigneeId: userId,
      title: '測試任務',
      description: '測試任務描述',
      type: 'FOLLOW_UP',
      priority: 'MEDIUM',
      status: 'PENDING',
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 明天
    },
  });
};

export const waitForAsync = (ms: number = 100) => new Promise(resolve => setTimeout(resolve, ms));