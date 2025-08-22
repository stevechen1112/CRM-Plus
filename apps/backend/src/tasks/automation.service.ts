import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/services/prisma.service';
import { TasksService } from './tasks.service';
import { TaskType, TaskPriority } from './dto/task.dto';

export interface AutomationRuleJob {
  type: 'NEW_CUSTOMER_FOLLOW_UP' | 'POTENTIAL_CUSTOMER_REMINDER' | 'LOYAL_CUSTOMER_VISIT' | 
        'POST_PURCHASE_CARE' | 'POST_PURCHASE_REPURCHASE' | 'PAYMENT_REMINDER' | 
        'BIRTHDAY_REMINDER' | 'ANNIVERSARY_REMINDER';
  customerId?: string;
  orderId?: string;
  data?: any;
}

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private prisma: PrismaService,
    private tasksService: TasksService,
    @InjectQueue('task-automation') private automationQueue: Queue,
  ) {}

  // 每小時檢查自動化規則
  @Cron(CronExpression.EVERY_HOUR)
  async processAutomationRules() {
    this.logger.log('Processing automation rules...');
    
    await Promise.all([
      this.checkNewCustomerFollowUp(),
      this.checkPotentialCustomerReminder(),
      this.checkLoyalCustomerVisit(),
      this.checkPostPurchaseCare(),
      this.checkPostPurchaseRepurchase(),
      this.checkPaymentReminders(),
      this.checkBirthdayReminders(),
      this.checkAnniversaryReminders(),
    ]);
  }

  // 規則1: 新名單 24 小時未跟進 → 建立提醒任務
  private async checkNewCustomerFollowUp() {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    const customers = await this.prisma.customer.findMany({
      where: {
        createdAt: {
          lte: cutoffTime,
        },
        // 沒有任何交流紀錄
        interactions: {
          none: {},
        },
        // 沒有跟進任務
        tasks: {
          none: {
            type: 'FOLLOW_UP',
            status: {
              in: ['PENDING', 'IN_PROGRESS'],
            },
          },
        },
      },
    });

    for (const customer of customers) {
      await this.createAutomationTask({
        customerPhone: customer.phone,
        title: `新客戶跟進 - ${customer.name}`,
        description: '新客戶已註冊 24 小時未跟進，請主動聯繫',
        type: TaskType.FOLLOW_UP,
        priority: TaskPriority.HIGH,
        dueAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        automationRuleType: 'NEW_CUSTOMER_FOLLOW_UP',
      });
    }

    this.logger.log(`Created ${customers.length} new customer follow-up tasks`);
  }

  // 規則2: 潛在客戶 7 天無互動 → 建立提醒任務
  private async checkPotentialCustomerReminder() {
    const cutoffTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    const customers = await this.prisma.customer.findMany({
      where: {
        status: 'POTENTIAL',
        // 最後互動時間超過7天
        OR: [
          {
            interactions: {
              none: {},
            },
            updatedAt: {
              lte: cutoffTime,
            },
          },
          {
            interactions: {
              every: {
                createdAt: {
                  lte: cutoffTime,
                },
              },
            },
          },
        ],
        // 沒有相關提醒任務
        tasks: {
          none: {
            type: 'CARE_CALL',
            status: {
              in: ['PENDING', 'IN_PROGRESS'],
            },
            createdAt: {
              gte: cutoffTime,
            },
          },
        },
      },
    });

    for (const customer of customers) {
      await this.createAutomationTask({
        customerPhone: customer.phone,
        title: `潛在客戶關懷 - ${customer.name}`,
        description: '潛在客戶 7 天無互動，建議主動關懷聯繫',
        type: TaskType.CARE_CALL,
        priority: TaskPriority.MEDIUM,
        dueAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
        automationRuleType: 'POTENTIAL_CUSTOMER_REMINDER',
      });
    }

    this.logger.log(`Created ${customers.length} potential customer reminder tasks`);
  }

  // 規則3: 熟客 90 天無互動 → 建立回訪任務
  private async checkLoyalCustomerVisit() {
    const cutoffTime = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago

    const customers = await this.prisma.customer.findMany({
      where: {
        status: 'ACTIVE',
        // 有過訂單的客戶 (認定為熟客)
        orders: {
          some: {},
        },
        // 最後互動時間超過90天
        OR: [
          {
            interactions: {
              none: {},
            },
            updatedAt: {
              lte: cutoffTime,
            },
          },
          {
            interactions: {
              every: {
                createdAt: {
                  lte: cutoffTime,
                },
              },
            },
          },
        ],
        // 沒有相關回訪任務
        tasks: {
          none: {
            type: 'CARE_CALL',
            status: {
              in: ['PENDING', 'IN_PROGRESS'],
            },
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        },
      },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    for (const customer of customers) {
      await this.createAutomationTask({
        customerPhone: customer.phone,
        title: `熟客回訪 - ${customer.name}`,
        description: '熟客 90 天無互動，建議主動回訪關懷',
        type: TaskType.CARE_CALL,
        priority: TaskPriority.MEDIUM,
        dueAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
        automationRuleType: 'LOYAL_CUSTOMER_VISIT',
      });
    }

    this.logger.log(`Created ${customers.length} loyal customer visit tasks`);
  }

  // 規則4: 成交後 D+3 → 建立關懷任務
  private async checkPostPurchaseCare() {
    const targetDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const orders = await this.prisma.order.findMany({
      where: {
        status: {
          in: ['DELIVERED', 'COMPLETED'],
        },
        updatedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        // 沒有相關關懷任務
        tasks: {
          none: {
            type: 'CARE_CALL',
          },
        },
      },
      include: {
        customer: true,
      },
    });

    for (const order of orders) {
      await this.createAutomationTask({
        customerPhone: order.customerPhone,
        orderId: order.id,
        title: `訂單關懷 - ${order.customer.name}`,
        description: `訂單 ${order.id} 完成後第3天關懷回訪`,
        type: TaskType.CARE_CALL,
        priority: TaskPriority.MEDIUM,
        dueAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        automationRuleType: 'POST_PURCHASE_CARE',
      });
    }

    this.logger.log(`Created ${orders.length} post-purchase care tasks`);
  }

  // 規則5: 成交後 D+30 → 建立回購任務
  private async checkPostPurchaseRepurchase() {
    const targetDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const orders = await this.prisma.order.findMany({
      where: {
        status: {
          in: ['DELIVERED', 'COMPLETED'],
        },
        updatedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        // 沒有相關回購任務
        tasks: {
          none: {
            type: 'REPURCHASE',
          },
        },
      },
      include: {
        customer: true,
      },
    });

    for (const order of orders) {
      await this.createAutomationTask({
        customerPhone: order.customerPhone,
        orderId: order.id,
        title: `回購推薦 - ${order.customer.name}`,
        description: `訂單 ${order.id} 完成後第30天，建議推薦新產品`,
        type: TaskType.REPURCHASE,
        priority: TaskPriority.MEDIUM,
        dueAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
        automationRuleType: 'POST_PURCHASE_REPURCHASE',
      });
    }

    this.logger.log(`Created ${orders.length} post-purchase repurchase tasks`);
  }

  // 規則6: 付款逾期或退款中 → 建立處理任務
  private async checkPaymentReminders() {
    const overdueOrders = await this.prisma.order.findMany({
      where: {
        OR: [
          {
            status: 'PENDING',
            createdAt: {
              lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days overdue
            },
          },
          {
            status: {
              in: ['REFUNDING', 'CANCELLED'],
            },
          },
        ],
        // 沒有相關處理任務
        tasks: {
          none: {
            type: {
              in: ['PAYMENT_REMINDER', 'REFUND_PROCESS'],
            },
            status: {
              in: ['PENDING', 'IN_PROGRESS'],
            },
          },
        },
      },
      include: {
        customer: true,
      },
    });

    for (const order of overdueOrders) {
      const isRefund = ['REFUNDING', 'CANCELLED'].includes(order.status);
      
      await this.createAutomationTask({
        customerPhone: order.customerPhone,
        orderId: order.id,
        title: isRefund 
          ? `退款處理 - ${order.customer.name}` 
          : `付款提醒 - ${order.customer.name}`,
        description: isRefund 
          ? `訂單 ${order.id} 需要處理退款事宜`
          : `訂單 ${order.id} 付款逾期，需要跟進處理`,
        type: isRefund ? TaskType.REFUND_PROCESS : TaskType.PAYMENT_REMINDER,
        priority: TaskPriority.HIGH,
        dueAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
        automationRuleType: 'PAYMENT_REMINDER',
      });
    }

    this.logger.log(`Created ${overdueOrders.length} payment reminder tasks`);
  }

  // 規則7: 客戶生日前 7 天 → 建立關懷任務
  private async checkBirthdayReminders() {
    const today = new Date();
    const reminderDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    
    // 格式化為 MM-DD 來比對
    const reminderMMDD = String(reminderDate.getMonth() + 1).padStart(2, '0') + 
                         '-' + String(reminderDate.getDate()).padStart(2, '0');

    const customers = await this.prisma.customer.findMany({
      where: {
        birthday: {
          not: null,
        },
        status: 'ACTIVE',
        // 沒有相關生日任務
        tasks: {
          none: {
            type: 'BIRTHDAY',
            status: {
              in: ['PENDING', 'IN_PROGRESS'],
            },
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        },
      },
    });

    const birthdayCustomers = customers.filter(customer => {
      if (!customer.birthday) return false;
      const birthday = new Date(customer.birthday);
      const birthMMDD = String(birthday.getMonth() + 1).padStart(2, '0') + 
                        '-' + String(birthday.getDate()).padStart(2, '0');
      return birthMMDD === reminderMMDD;
    });

    for (const customer of birthdayCustomers) {
      await this.createAutomationTask({
        customerPhone: customer.phone,
        title: `生日關懷 - ${customer.name}`,
        description: `${customer.name} 即將生日 (${new Date(customer.birthday!).toLocaleDateString()})，準備生日祝福`,
        type: TaskType.BIRTHDAY,
        priority: TaskPriority.MEDIUM,
        dueAt: new Date(customer.birthday!.getTime() - 24 * 60 * 60 * 1000), // 1 day before birthday
        automationRuleType: 'BIRTHDAY_REMINDER',
      });
    }

    this.logger.log(`Created ${birthdayCustomers.length} birthday reminder tasks`);
  }

  // 首購周年提醒 (額外功能)
  private async checkAnniversaryReminders() {
    const today = new Date();
    const reminderDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    
    const customers = await this.prisma.customer.findMany({
      where: {
        status: 'ACTIVE',
        orders: {
          some: {},
        },
        // 沒有相關周年任務
        tasks: {
          none: {
            type: 'ANNIVERSARY',
            status: {
              in: ['PENDING', 'IN_PROGRESS'],
            },
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        },
      },
      include: {
        orders: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });

    for (const customer of customers) {
      const firstOrder = customer.orders[0];
      if (!firstOrder) continue;

      const firstOrderDate = new Date(firstOrder.createdAt);
      const anniversaryThisYear = new Date(
        reminderDate.getFullYear(),
        firstOrderDate.getMonth(),
        firstOrderDate.getDate()
      );

      // 檢查是否是首購周年前7天
      if (Math.abs(anniversaryThisYear.getTime() - reminderDate.getTime()) < 24 * 60 * 60 * 1000) {
        await this.createAutomationTask({
          customerPhone: customer.phone,
          orderId: firstOrder.id,
          title: `首購周年 - ${customer.name}`,
          description: `${customer.name} 首次購買周年即將到來，準備周年感謝`,
          type: TaskType.ANNIVERSARY,
          priority: TaskPriority.LOW,
          dueAt: anniversaryThisYear,
          automationRuleType: 'ANNIVERSARY_REMINDER',
        });
      }
    }
  }

  private async createAutomationTask(params: {
    customerPhone: string;
    orderId?: string;
    title: string;
    description: string;
    type: TaskType;
    priority: TaskPriority;
    dueAt: Date;
    automationRuleType: string;
  }) {
    const { automationRuleType, ...taskData } = params;
    
    try {
      await this.tasksService.createSystemTask({
        ...taskData,
        dueAt: params.dueAt.toISOString(),
      });

      this.logger.log(`Created automation task: ${automationRuleType} for customer ${params.customerPhone}`);
    } catch (error) {
      this.logger.error(`Failed to create automation task: ${automationRuleType}`, error);
    }
  }

  // 手動觸發自動化規則 (用於測試或立即執行)
  async triggerAutomationRule(ruleType: string, customerId?: string, orderId?: string) {
    const job: AutomationRuleJob = {
      type: ruleType as any,
      customerId,
      orderId,
    };

    await this.automationQueue.add('process-automation-rule', job, {
      delay: 1000, // 1 second delay
    });

    this.logger.log(`Triggered automation rule: ${ruleType}`);
  }
}