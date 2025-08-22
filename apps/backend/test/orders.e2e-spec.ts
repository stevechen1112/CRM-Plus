import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/services/prisma.service';
import { createTestUser, createTestCustomer, createTestOrder } from './test-utils';

describe('Orders API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userToken: string;
  let managerToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    
    await app.init();

    // 建立測試用戶並獲取 token
    const user = await createTestUser(prisma, 'STAFF');
    const manager = await createTestUser(prisma, 'MANAGER');

    // 模擬登入獲取 token（這裡簡化處理）
    userToken = 'mock-user-token';
    managerToken = 'mock-manager-token';
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('GET /orders', () => {
    beforeEach(async () => {
      const customer1 = await createTestCustomer(prisma, '0912345678');
      const customer2 = await createTestCustomer(prisma, '0923456789');
      
      await createTestOrder(prisma, customer1.phone, 1000);
      await createTestOrder(prisma, customer2.phone, 2000);
    });

    it('應該返回訂單列表', () => {
      return request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.pagination).toBeDefined();
        });
    });

    it('應該支援按付款狀態篩選', () => {
      return request(app.getHttpServer())
        .get('/orders?paymentStatus=PAID')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          if (res.body.data.length > 0) {
            expect(res.body.data.every((order: any) => order.paymentStatus === 'PAID')).toBe(true);
          }
        });
    });

    it('應該支援按金額範圍篩選', () => {
      return request(app.getHttpServer())
        .get('/orders?minAmount=1500')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          if (res.body.data.length > 0) {
            expect(res.body.data.every((order: any) => order.totalAmount >= 1500)).toBe(true);
          }
        });
    });

    it('應該支援客戶電話搜尋', () => {
      return request(app.getHttpServer())
        .get('/orders?search=0912345678')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          if (res.body.data.length > 0) {
            expect(res.body.data.every((order: any) => order.customerPhone === '0912345678')).toBe(true);
          }
        });
    });
  });

  describe('POST /orders', () => {
    it('應該成功創建訂單', async () => {
      const customer = await createTestCustomer(prisma, '0934567890');
      
      const orderData = {
        customerPhone: customer.phone,
        items: [
          {
            productName: '測試商品',
            quantity: 2,
            unitPrice: 500,
            totalPrice: 1000,
          },
        ],
        paymentMethod: '信用卡',
        deliveryMethod: '宅配',
        notes: '測試訂單',
      };

      return request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderData)
        .expect(201)
        .expect((res) => {
          expect(res.body.customerPhone).toBe(customer.phone);
          expect(res.body.totalAmount).toBe(1000);
          expect(res.body.items).toHaveLength(1);
          expect(res.body.paymentStatus).toBe('PENDING');
          expect(res.body.orderStatus).toBe('CONFIRMED');
        });
    });

    it('應該拒絕不存在的客戶', () => {
      const orderData = {
        customerPhone: '0999999999',
        items: [
          {
            productName: '測試商品',
            quantity: 1,
            unitPrice: 100,
            totalPrice: 100,
          },
        ],
      };

      return request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderData)
        .expect(400);
    });

    it('應該驗證訂單項目', () => {
      const orderData = {
        customerPhone: '0912345678',
        items: [], // 空的項目列表
      };

      return request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderData)
        .expect(400);
    });
  });

  describe('GET /orders/:id', () => {
    it('應該返回指定訂單詳情', async () => {
      const customer = await createTestCustomer(prisma, '0945678901');
      const order = await createTestOrder(prisma, customer.phone, 1500);

      return request(app.getHttpServer())
        .get(`/orders/${order.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(order.id);
          expect(res.body.customerPhone).toBe(customer.phone);
          expect(res.body.totalAmount).toBe(1500);
          expect(res.body.items).toBeDefined();
        });
    });

    it('不存在的訂單應該返回 404', () => {
      return request(app.getHttpServer())
        .get('/orders/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  describe('PATCH /orders/:id', () => {
    it('應該成功更新訂單', async () => {
      const customer = await createTestCustomer(prisma, '0956789012');
      const order = await createTestOrder(prisma, customer.phone, 1000);

      const updateData = {
        paymentStatus: 'PAID',
        orderStatus: 'PROCESSING',
        notes: '已付款，開始處理',
      };

      return request(app.getHttpServer())
        .patch(`/orders/${order.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body.paymentStatus).toBe('PAID');
          expect(res.body.orderStatus).toBe('PROCESSING');
          expect(res.body.notes).toBe('已付款，開始處理');
        });
    });

    it('應該正確更新訂單項目', async () => {
      const customer = await createTestCustomer(prisma, '0967890123');
      const order = await createTestOrder(prisma, customer.phone, 1000);

      const updateData = {
        items: [
          {
            id: order.items[0].id,
            productName: '更新商品',
            quantity: 3,
            unitPrice: 400,
            totalPrice: 1200,
          },
          {
            productName: '新增商品',
            quantity: 1,
            unitPrice: 300,
            totalPrice: 300,
          },
        ],
      };

      return request(app.getHttpServer())
        .patch(`/orders/${order.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body.totalAmount).toBe(1500);
          expect(res.body.items).toHaveLength(2);
        });
    });
  });

  describe('DELETE /orders/:id', () => {
    it('經理應該能刪除訂單', async () => {
      const customer = await createTestCustomer(prisma, '0978901234');
      const order = await createTestOrder(prisma, customer.phone, 1000);

      return request(app.getHttpServer())
        .delete(`/orders/${order.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);
    });

    it('一般員工應該被拒絕刪除訂單', async () => {
      const customer = await createTestCustomer(prisma, '0989012345');
      const order = await createTestOrder(prisma, customer.phone, 1000);

      return request(app.getHttpServer())
        .delete(`/orders/${order.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('GET /orders/customer/:phone', () => {
    it('應該返回指定客戶的所有訂單', async () => {
      const customer = await createTestCustomer(prisma, '0990123456');
      
      await createTestOrder(prisma, customer.phone, 1000);
      await createTestOrder(prisma, customer.phone, 2000);
      await createTestOrder(prisma, customer.phone, 1500);

      return request(app.getHttpServer())
        .get(`/orders/customer/${customer.phone}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(3);
          expect(res.body.every((order: any) => order.customerPhone === customer.phone)).toBe(true);
        });
    });

    it('應該支援限制返回數量', async () => {
      const customer = await createTestCustomer(prisma, '0901234567');
      
      await createTestOrder(prisma, customer.phone, 1000);
      await createTestOrder(prisma, customer.phone, 2000);
      await createTestOrder(prisma, customer.phone, 1500);

      return request(app.getHttpServer())
        .get(`/orders/customer/${customer.phone}?limit=2`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(2);
        });
    });
  });

  describe('GET /orders/export', () => {
    it('經理應該能匯出訂單資料', async () => {
      const customer = await createTestCustomer(prisma, '0912340000');
      await createTestOrder(prisma, customer.phone, 1000);

      return request(app.getHttpServer())
        .get('/orders/export')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.headers['content-type']).toContain('text/csv');
          expect(res.headers['content-disposition']).toContain('attachment');
        });
    });

    it('應該支援篩選條件匯出', async () => {
      const customer = await createTestCustomer(prisma, '0912340001');
      await createTestOrder(prisma, customer.phone, 1000);

      return request(app.getHttpServer())
        .get('/orders/export?paymentStatus=PENDING&minAmount=500')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);
    });

    it('一般員工應該被拒絕匯出', () => {
      return request(app.getHttpServer())
        .get('/orders/export')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });
});