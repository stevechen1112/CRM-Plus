import { Test, TestingModule } from '@nestjs/testing';
import { AutomationService } from './automation.service';
import { PrismaService } from '../common/services/prisma.service';
import { createTestingModule, createTestCustomer, createTestUser, createTestInteraction, waitForAsync } from '../../test/test-utils';

describe('AutomationService', () => {
  let service: AutomationService;
  let prisma: PrismaService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await createTestingModule([AutomationService]);
    service = module.get<AutomationService>(AutomationService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('未跟進客戶任務生成測試', () => {
    it('應該為超過7天未互動的客戶創建跟進任務', async () => {
      const user = await createTestUser(prisma);
      const customer = await createTestCustomer(prisma);
      
      // 建立一個8天前的互動記錄
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 8);
      
      await prisma.interaction.create({
        data: {
          customerPhone: customer.phone,
          userId: user.id,
          type: 'PHONE',
          summary: '舊的互動',
          notes: '8天前的互動',
          status: 'COMPLETED',
          createdAt: pastDate,
        },
      });

      // 執行自動化規則檢查
      await service.checkUnfollowedCustomers();
      
      // 檢查是否已創建跟進任務
      const tasks = await prisma.task.findMany({
        where: {
          customerPhone: customer.phone,
          type: 'FOLLOW_UP',
          status: 'PENDING',
        },
      });
      
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toContain('未跟進');
      expect(tasks[0].priority).toBe('HIGH');
    });

    it('不應該為近期有互動的客戶創建任務', async () => {
      const user = await createTestUser(prisma);
      const customer = await createTestCustomer(prisma);
      
      // 建立一個2天前的互動記錄
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 2);
      
      await prisma.interaction.create({
        data: {
          customerPhone: customer.phone,
          userId: user.id,
          type: 'PHONE',
          summary: '近期互動',
          notes: '2天前的互動',
          status: 'COMPLETED',
          createdAt: recentDate,
        },
      });

      // 執行自動化規則檢查
      await service.checkUnfollowedCustomers();
      
      // 不應該有任務被創建
      const tasks = await prisma.task.findMany({
        where: {
          customerPhone: customer.phone,
          type: 'FOLLOW_UP',
          status: 'PENDING',
        },
      });
      
      expect(tasks).toHaveLength(0);
    });

    it('不應該為已有待處理跟進任務的客戶重複創建任務', async () => {
      const user = await createTestUser(prisma);
      const customer = await createTestCustomer(prisma);
      
      // 建立舊的互動記錄
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      
      await prisma.interaction.create({
        data: {
          customerPhone: customer.phone,
          userId: user.id,
          type: 'PHONE',
          summary: '舊的互動',
          notes: '10天前的互動',
          status: 'COMPLETED',
          createdAt: pastDate,
        },
      });

      // 手動創建一個待處理的跟進任務
      await prisma.task.create({
        data: {
          customerPhone: customer.phone,
          assigneeId: user.id,
          title: '現有的跟進任務',
          type: 'FOLLOW_UP',
          priority: 'MEDIUM',
          status: 'PENDING',
          dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      // 執行自動化規則檢查
      await service.checkUnfollowedCustomers();
      
      // 應該只有一個跟進任務（原有的）
      const tasks = await prisma.task.findMany({
        where: {
          customerPhone: customer.phone,
          type: 'FOLLOW_UP',
          status: 'PENDING',
        },
      });
      
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('現有的跟進任務');
    });
  });

  describe('高價值客戶任務生成測試', () => {
    it('應該為高消費客戶創建關懷任務', async () => {
      const user = await createTestUser(prisma);
      const customer = await createTestCustomer(prisma);
      
      // 建立高價值訂單
      await prisma.order.create({
        data: {
          orderNo: `ORD_HIGH_${Date.now()}`,
          customerPhone: customer.phone,
          totalAmount: 50000,
          paymentStatus: 'PAID',
          orderStatus: 'DELIVERED',
          items: {
            create: [
              {
                productName: '高價商品',
                quantity: 1,
                unitPrice: 50000,
                totalPrice: 50000,
              },
            ],
          },
        },
      });

      // 執行高價值客戶檢查
      await service.checkHighValueCustomers();
      
      // 檢查是否創建了關懷任務
      const tasks = await prisma.task.findMany({
        where: {
          customerPhone: customer.phone,
          type: 'CUSTOMER_CARE',
          status: 'PENDING',
        },
      });
      
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toContain('高價值客戶關懷');
      expect(tasks[0].priority).toBe('HIGH');
    });

    it('不應該為低消費客戶創建關懷任務', async () => {
      const customer = await createTestCustomer(prisma);
      
      // 建立一般訂單
      await prisma.order.create({
        data: {
          orderNo: `ORD_NORMAL_${Date.now()}`,
          customerPhone: customer.phone,
          totalAmount: 1000,
          paymentStatus: 'PAID',
          orderStatus: 'DELIVERED',
          items: {
            create: [
              {
                productName: '一般商品',
                quantity: 1,
                unitPrice: 1000,
                totalPrice: 1000,
              },
            ],
          },
        },
      });

      // 執行高價值客戶檢查
      await service.checkHighValueCustomers();
      
      // 不應該有關懷任務被創建
      const tasks = await prisma.task.findMany({
        where: {
          customerPhone: customer.phone,
          type: 'CUSTOMER_CARE',
          status: 'PENDING',
        },
      });
      
      expect(tasks).toHaveLength(0);
    });
  });

  describe('任務排程和時間管理測試', () => {
    it('應該設定正確的任務到期時間', async () => {
      const user = await createTestUser(prisma);
      const customer = await createTestCustomer(prisma);
      
      // 建立超時未互動記錄
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 8);
      
      await prisma.interaction.create({
        data: {
          customerPhone: customer.phone,
          userId: user.id,
          type: 'PHONE',
          summary: '舊互動',
          notes: '內容',
          status: 'COMPLETED',
          createdAt: pastDate,
        },
      });

      const beforeCheck = new Date();
      await service.checkUnfollowedCustomers();
      const afterCheck = new Date();
      
      const task = await prisma.task.findFirst({
        where: {
          customerPhone: customer.phone,
          type: 'FOLLOW_UP',
        },
      });
      
      expect(task).toBeDefined();
      
      // 任務應該設定在明天到期
      const expectedDueDate = new Date();
      expectedDueDate.setDate(expectedDueDate.getDate() + 1);
      expectedDueDate.setHours(9, 0, 0, 0); // 設定為明天上午9點
      
      const taskDueDate = new Date(task!.dueAt);
      expect(taskDueDate.getDate()).toBe(expectedDueDate.getDate());
      expect(taskDueDate.getHours()).toBe(9);
    });

    it('應該正確指派任務給合適的用戶', async () => {
      const manager = await createTestUser(prisma, 'MANAGER');
      const staff1 = await createTestUser(prisma, 'STAFF');
      const staff2 = await createTestUser(prisma, 'STAFF');
      const customer = await createTestCustomer(prisma);
      
      // 建立超時未互動記錄
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 8);
      
      await prisma.interaction.create({
        data: {
          customerPhone: customer.phone,
          userId: staff1.id,
          type: 'PHONE',
          summary: '舊互動',
          notes: '內容',
          status: 'COMPLETED',
          createdAt: pastDate,
        },
      });

      await service.checkUnfollowedCustomers();
      
      const task = await prisma.task.findFirst({
        where: {
          customerPhone: customer.phone,
          type: 'FOLLOW_UP',
        },
      });
      
      // 任務應該指派給有互動記錄的員工或經理
      expect(task).toBeDefined();
      expect([staff1.id, manager.id]).toContain(task!.assigneeId);
    });
  });

  describe('批量處理和性能測試', () => {
    it('應該能夠處理大量客戶的自動化檢查', async () => {
      const users = await Promise.all([
        createTestUser(prisma, 'STAFF'),
        createTestUser(prisma, 'STAFF'),
        createTestUser(prisma, 'MANAGER'),
      ]);

      // 建立多個需要跟進的客戶
      const customers = await Promise.all(
        Array.from({ length: 10 }, () => createTestCustomer(prisma))
      );

      // 為每個客戶建立過時的互動記錄
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 9);

      await Promise.all(
        customers.map(customer =>
          prisma.interaction.create({
            data: {
              customerPhone: customer.phone,
              userId: users[0].id,
              type: 'PHONE',
              summary: '過時互動',
              notes: '內容',
              status: 'COMPLETED',
              createdAt: pastDate,
            },
          })
        )
      );

      const startTime = Date.now();
      await service.checkUnfollowedCustomers();
      const endTime = Date.now();

      // 檢查執行時間（應該在合理範圍內）
      expect(endTime - startTime).toBeLessThan(5000); // 5秒內完成

      // 檢查任務創建結果
      const tasks = await prisma.task.findMany({
        where: {
          type: 'FOLLOW_UP',
          status: 'PENDING',
        },
      });

      expect(tasks).toHaveLength(10);
    });
  });
});