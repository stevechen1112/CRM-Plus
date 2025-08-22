import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/services/prisma.service';
import { AuditService } from '../audit/audit.service';
import * as nodemailer from 'nodemailer';

export interface NotificationData {
  type: 'EMAIL' | 'IN_APP' | 'SMS';
  recipientId: string;
  title: string;
  message: string;
  data?: any;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export interface TaskNotificationData extends NotificationData {
  taskId: string;
  dueAt: Date;
  notificationType: 'TASK_DUE_SOON' | 'TASK_OVERDUE';
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private emailTransporter: nodemailer.Transporter;

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    @InjectQueue('notifications') private notificationQueue: Queue,
  ) {
    this.initializeEmailTransporter();
  }

  private initializeEmailTransporter() {
    // 配置 MailHog 或其他 SMTP 服務
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'localhost',
      port: parseInt(process.env.MAIL_PORT) || 1025,
      secure: false, // MailHog doesn't use SSL
      auth: process.env.MAIL_USER ? {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      } : undefined,
    });
  }

  // 每15分鐘檢查任務到期通知
  @Cron('*/15 * * * *') // Every 15 minutes
  async checkTaskNotifications() {
    this.logger.log('Checking task notifications...');
    
    // 檢查1小時內到期的任務
    const soonDueTasks = await this.findTasksDueSoon();
    for (const task of soonDueTasks) {
      await this.sendTaskNotification(task, 'TASK_DUE_SOON');
    }

    // 檢查已逾期的任務
    const overdueTasks = await this.findOverdueTasks();
    for (const task of overdueTasks) {
      await this.sendTaskNotification(task, 'TASK_OVERDUE');
    }
  }

  private async findTasksDueSoon() {
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    const now = new Date();

    return this.prisma.task.findMany({
      where: {
        status: {
          in: ['PENDING', 'IN_PROGRESS'],
        },
        dueAt: {
          gte: now,
          lte: oneHourFromNow,
        },
        // notifications field doesn't exist in Task model
      },
      include: {
        customer: true,
        assignee: true,
        // order field doesn't exist in Task model
      },
    });
  }

  private async findOverdueTasks() {
    const now = new Date();

    return this.prisma.task.findMany({
      where: {
        status: {
          in: ['PENDING', 'IN_PROGRESS'],
        },
        dueAt: {
          lt: now,
        },
        // notifications field doesn't exist in Task model
      },
      include: {
        customer: true,
        assignee: true,
        // order field doesn't exist in Task model
      },
    });
  }

  private async sendTaskNotification(task: any, notificationType: 'TASK_DUE_SOON' | 'TASK_OVERDUE') {
    const recipient = task.assigneeUser;
    if (!recipient) {
      this.logger.warn(`Task ${task.id} has no assignee, skipping notification`);
      return;
    }

    const isOverdue = notificationType === 'TASK_OVERDUE';
    const title = isOverdue ? '任務已逾期' : '任務即將到期';
    const urgency = isOverdue ? '已逾期' : '即將到期';
    
    const message = `任務「${task.title}」${urgency}\n` +
                   `客戶：${task.customer.name}\n` +
                   `到期時間：${task.dueAt.toLocaleString('zh-TW')}\n` +
                   `優先級：${task.priority}`;

    // 發送郵件通知
    await this.sendEmailNotification({
      to: recipient.email,
      subject: `[CRM] ${title} - ${task.title}`,
      text: message,
      html: this.generateTaskNotificationHTML(task, notificationType),
    });

    // 創建站內通知
    await this.createInAppNotification({
      recipientId: recipient.id,
      title,
      message,
      type: 'TASK_NOTIFICATION',
      priority: isOverdue ? 'HIGH' : 'MEDIUM',
      data: {
        taskId: task.id,
        customerId: task.customerPhone,
        orderId: task.orderId,
        notificationType,
      },
    });

    // 記錄通知發送
    await this.recordNotification({
      taskId: task.id,
      recipientId: recipient.id,
      type: notificationType,
      sentAt: new Date(),
    });

    this.logger.log(`Sent ${notificationType} notification for task ${task.id} to ${recipient.email}`);
  }

  private generateTaskNotificationHTML(task: any, notificationType: string): string {
    const isOverdue = notificationType === 'TASK_OVERDUE';
    const statusColor = isOverdue ? '#DC2626' : '#F59E0B';
    const statusText = isOverdue ? '已逾期' : '即將到期';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>任務通知</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: ${statusColor}; margin-top: 0;">任務${statusText}</h2>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #495057;">${task.title}</h3>
            <p><strong>客戶：</strong> ${task.customer.name}</p>
            <p><strong>電話：</strong> ${task.customer.phone}</p>
            <p><strong>到期時間：</strong> <span style="color: ${statusColor};">${task.dueAt.toLocaleString('zh-TW')}</span></p>
            <p><strong>優先級：</strong> ${task.priority}</p>
            ${task.description ? `<p><strong>描述：</strong> ${task.description}</p>` : ''}
            ${task.order ? `<p><strong>相關訂單：</strong> ${task.order.id}</p>` : ''}
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/tasks" 
               style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              查看任務詳情
            </a>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="text-align: center; font-size: 14px; color: #6c757d;">
            此郵件由 CRM 系統自動發送，請勿直接回覆。
          </p>
        </div>
      </body>
      </html>
    `;
  }

  async sendEmailNotification(params: {
    to: string;
    subject: string;
    text: string;
    html?: string;
  }) {
    try {
      await this.emailTransporter.sendMail({
        from: process.env.MAIL_FROM || 'noreply@crm-system.local',
        to: params.to,
        subject: params.subject,
        text: params.text,
        html: params.html,
      });

      this.logger.log(`Email sent to ${params.to}: ${params.subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${params.to}:`, error);
      throw error;
    }
  }

  async createInAppNotification(params: {
    recipientId: string;
    title: string;
    message: string;
    type: string;
    priority?: string;
    data?: any;
  }) {
    // notification table doesn't exist, using auditLog instead
    return this.prisma.auditLog.create({
      data: {
        recipientId: params.recipientId,
        title: params.title,
        message: params.message,
        type: params.type,
        priority: params.priority || 'MEDIUM',
        data: params.data,
        isRead: false,
      },
    });
  }

  private async recordNotification(params: {
    taskId: string;
    recipientId: string;
    type: string;
    sentAt: Date;
  }) {
    // taskNotification table doesn't exist, using auditLog instead
    await this.prisma.auditLog.create({
      data: params,
    });
  }

  // 獲取用戶的站內通知 - 暫時返回空陣列 (TODO: 建立 notification 表)
  async getInAppNotifications(userId: string, limit: number = 50) {
    // return this.prisma.notification.findMany({
    //   where: {
    //     recipientId: userId,
    //   },
    //   orderBy: {
    //     createdAt: 'desc',
    //   },
    //   take: limit,
    // });
    return [];
  }

  // 標記通知為已讀 - 暫時 stub (TODO: 建立 notification 表)
  async markNotificationAsRead(notificationId: string, userId: string) {
    // const notification = await this.prisma.notification.updateMany({
    //   where: {
    //     id: notificationId,
    //     recipientId: userId,
    //   },
    //   data: {
    //     isRead: true,
    //     readAt: new Date(),
    //   },
    // });

    // if (notification.count === 0) {
    //   throw new Error('Notification not found or access denied');
    // }

    // return notification;
    return { count: 1 };
  }

  // 標記所有通知為已讀 - 暫時 stub (TODO: 建立 notification 表)
  async markAllNotificationsAsRead(userId: string) {
    // return this.prisma.notification.updateMany({
    //   where: {
    //     recipientId: userId,
    //     isRead: false,
    //   },
    //   data: {
    //     isRead: true,
    //     readAt: new Date(),
    //   },
    // });
    return { count: 0 };
  }

  // 獲取未讀通知數量 - 暫時返回 0 (TODO: 建立 notification 表)
  async getUnreadNotificationCount(userId: string): Promise<number> {
    // return this.prisma.notification.count({
    //   where: {
    //     recipientId: userId,
    //     isRead: false,
    //   },
    // });
    return 0;
  }

  // 發送自定義通知
  async sendCustomNotification(params: NotificationData) {
    await this.notificationQueue.add('send-notification', params, {
      priority: params.priority === 'URGENT' ? 1 : 
                params.priority === 'HIGH' ? 2 : 
                params.priority === 'MEDIUM' ? 3 : 4,
    });
  }
}