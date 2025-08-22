import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../common/services/prisma.service';
import { createTestingModule, createTestCustomer, createTestUser, createTestOrder } from '../../test/test-utils';
import { PaymentStatus, OrderStatus } from '@crm/shared';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: PrismaService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await createTestingModule([OrdersService]);
    service = module.get<OrdersService>(OrdersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('訂單金額計算測試', () => {
    it('應該正確計算單項商品總金額', async () => {
      const customer = await createTestCustomer(prisma);
      
      const orderData = {
        customerPhone: customer.phone,
        items: [
          {
            productName: '商品A',
            quantity: 3,
            unitPrice: 100,
            totalPrice: 300,
          },
        ],
        paymentMethod: '信用卡',
        deliveryMethod: '宅配',
      };

      const order = await service.create(orderData);
      
      expect(order.totalAmount).toBe(300);
      expect(order.items).toHaveLength(1);
      expect(order.items[0].totalPrice).toBe(300);
    });

    it('應該正確計算多項商品總金額', async () => {
      const customer = await createTestCustomer(prisma);
      
      const orderData = {
        customerPhone: customer.phone,
        items: [
          {
            productName: '商品A',
            quantity: 2,
            unitPrice: 150,
            totalPrice: 300,
          },
          {
            productName: '商品B',
            quantity: 1,
            unitPrice: 200,
            totalPrice: 200,
          },
          {
            productName: '商品C',
            quantity: 3,
            unitPrice: 100,
            totalPrice: 300,
          },
        ],
        paymentMethod: '現金',
        deliveryMethod: '門市取貨',
      };

      const order = await service.create(orderData);
      
      expect(order.totalAmount).toBe(800);
      expect(order.items).toHaveLength(3);
      
      // 驗證每個項目的計算
      const itemA = order.items.find(item => item.productName === '商品A');
      const itemB = order.items.find(item => item.productName === '商品B');
      const itemC = order.items.find(item => item.productName === '商品C');
      
      expect(itemA!.totalPrice).toBe(300);
      expect(itemB!.totalPrice).toBe(200);
      expect(itemC!.totalPrice).toBe(300);
    });

    it('更新訂單項目時應該重新計算總金額', async () => {
      const customer = await createTestCustomer(prisma);
      const order = await createTestOrder(prisma, customer.phone, 1000);
      
      // 更新訂單，新增項目
      const updateData = {
        items: [
          {
            id: order.items[0].id,
            productName: '商品A（更新）',
            quantity: 2,
            unitPrice: 600,
            totalPrice: 1200,
          },
          {
            productName: '商品B（新增）',
            quantity: 1,
            unitPrice: 300,
            totalPrice: 300,
          },
        ],
      };

      const updatedOrder = await service.update(order.id, updateData);
      
      expect(updatedOrder.totalAmount).toBe(1500);
      expect(updatedOrder.items).toHaveLength(2);
    });

    it('應該處理小數點金額計算', async () => {
      const customer = await createTestCustomer(prisma);
      
      const orderData = {
        customerPhone: customer.phone,
        items: [
          {
            productName: '商品A',
            quantity: 3,
            unitPrice: 33.33,
            totalPrice: 99.99,
          },
          {
            productName: '商品B',
            quantity: 2,
            unitPrice: 50.5,
            totalPrice: 101,
          },
        ],
        paymentMethod: '信用卡',
      };

      const order = await service.create(orderData);
      
      expect(order.totalAmount).toBe(200.99);
    });
  });

  describe('訂單狀態管理測試', () => {
    it('應該正確更新付款狀態', async () => {
      const customer = await createTestCustomer(prisma);
      const order = await createTestOrder(prisma, customer.phone);
      
      // 更新為已付款
      const updatedOrder = await service.update(order.id, {
        paymentStatus: 'PAID' as PaymentStatus,
      });
      
      expect(updatedOrder.paymentStatus).toBe('PAID');
    });

    it('應該正確更新訂單狀態', async () => {
      const customer = await createTestCustomer(prisma);
      const order = await createTestOrder(prisma, customer.phone);
      
      // 更新為處理中
      const updatedOrder = await service.update(order.id, {
        orderStatus: 'PROCESSING' as OrderStatus,
      });
      
      expect(updatedOrder.orderStatus).toBe('PROCESSING');
    });

    it('應該記錄狀態變更的時間戳記', async () => {
      const customer = await createTestCustomer(prisma);
      const order = await createTestOrder(prisma, customer.phone);
      
      const originalUpdatedAt = order.updatedAt;
      
      // 等待一毫秒確保時間戳記不同
      await new Promise(resolve => setTimeout(resolve, 1));
      
      const updatedOrder = await service.update(order.id, {
        orderStatus: 'SHIPPED' as OrderStatus,
      });
      
      expect(updatedOrder.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('訂單查詢和篩選測試', () => {
    beforeEach(async () => {
      const customer1 = await createTestCustomer(prisma, '0912345678');
      const customer2 = await createTestCustomer(prisma, '0923456789');
      
      // 建立不同狀態的訂單
      await createTestOrder(prisma, customer1.phone, 1000);
      await createTestOrder(prisma, customer2.phone, 2000);
      
      // 建立已付款訂單
      await prisma.order.create({
        data: {
          orderNo: `ORD_PAID_${Date.now()}`,
          customerPhone: customer1.phone,
          totalAmount: 1500,
          paymentStatus: 'PAID',
          orderStatus: 'DELIVERED',
          items: {
            create: [
              {
                productName: '已付款商品',
                quantity: 1,
                unitPrice: 1500,
                totalPrice: 1500,
              },
            ],
          },
        },
      });
    });

    it('應該支援按付款狀態篩選', async () => {
      const paidOrders = await service.findAll({
        paymentStatus: 'PAID',
      });
      
      expect(paidOrders.data.length).toBeGreaterThan(0);
      expect(paidOrders.data.every(order => order.paymentStatus === 'PAID')).toBe(true);
    });

    it('應該支援按金額範圍篩選', async () => {
      const expensiveOrders = await service.findAll({
        minAmount: 1500,
      });
      
      expect(expensiveOrders.data.length).toBeGreaterThan(0);
      expect(expensiveOrders.data.every(order => order.totalAmount >= 1500)).toBe(true);
    });

    it('應該支援按客戶電話搜尋', async () => {
      const orders = await service.findAll({
        search: '0912345678',
      });
      
      expect(orders.data.length).toBeGreaterThan(0);
      expect(orders.data.every(order => order.customerPhone === '0912345678')).toBe(true);
    });

    it('應該正確處理分頁', async () => {
      const page1 = await service.findAll({
        page: 1,
        limit: 2,
      });
      
      expect(page1.data).toHaveLength(2);
      expect(page1.pagination.page).toBe(1);
      expect(page1.pagination.limit).toBe(2);
    });
  });

  describe('訂單與客戶關聯測試', () => {
    it('刪除客戶時應該保留訂單記錄', async () => {
      const customer = await createTestCustomer(prisma);
      const order = await createTestOrder(prisma, customer.phone);
      
      // 刪除客戶
      await prisma.customer.delete({
        where: { phone: customer.phone },
      });
      
      // 訂單應該仍然存在
      const existingOrder = await service.findOne(order.id);
      expect(existingOrder).toBeDefined();
      expect(existingOrder!.customerPhone).toBe(customer.phone);
    });

    it('應該能查詢客戶的所有訂單', async () => {
      const customer = await createTestCustomer(prisma);
      
      // 建立多個訂單
      await createTestOrder(prisma, customer.phone, 1000);
      await createTestOrder(prisma, customer.phone, 2000);
      await createTestOrder(prisma, customer.phone, 1500);
      
      const customerOrders = await service.getCustomerOrders(customer.phone);
      
      expect(customerOrders).toHaveLength(3);
      expect(customerOrders.every(order => order.customerPhone === customer.phone)).toBe(true);
    });
  });
});