import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/services/prisma.service';
import { createTestUser, createTestCustomer } from './test-utils';

describe('Customers API (e2e)', () => {
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

    // 登入獲取 token
    const userLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: user.username,
        password: 'password', // 假設測試密碼
      });
    userToken = userLoginResponse.body.accessToken;

    const managerLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: manager.username,
        password: 'password',
      });
    managerToken = managerLoginResponse.body.accessToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('GET /customers', () => {
    beforeEach(async () => {
      // 建立測試資料
      await createTestCustomer(prisma, '0912345678');
      await createTestCustomer(prisma, '0923456789');
      await createTestCustomer(prisma, '0934567890');
    });

    it('應該返回客戶列表', () => {
      return request(app.getHttpServer())
        .get('/customers')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.pagination).toBeDefined();
        });
    });

    it('應該支援搜尋功能', () => {
      return request(app.getHttpServer())
        .get('/customers?search=091')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          if (res.body.data.length > 0) {
            expect(res.body.data[0].phone).toContain('091');
          }
        });
    });

    it('應該支援分頁', () => {
      return request(app.getHttpServer())
        .get('/customers?page=1&limit=2')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.pagination.page).toBe(1);
          expect(res.body.pagination.limit).toBe(2);
          expect(res.body.data.length).toBeLessThanOrEqual(2);
        });
    });

    it('未認證用戶應該被拒絕', () => {
      return request(app.getHttpServer())
        .get('/customers')
        .expect(401);
    });
  });

  describe('POST /customers', () => {
    it('應該成功創建客戶', () => {
      const customerData = {
        phone: '0945678901',
        name: '新客戶',
        email: 'new@example.com',
        tags: ['新客戶'],
        marketingConsent: true,
      };

      return request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${userToken}`)
        .send(customerData)
        .expect(201)
        .expect((res) => {
          expect(res.body.phone).toBe(customerData.phone);
          expect(res.body.name).toBe(customerData.name);
          expect(res.body.email).toBe(customerData.email);
        });
    });

    it('應該拒絕重複的手機號碼', async () => {
      const phone = '0956789012';
      await createTestCustomer(prisma, phone);

      const customerData = {
        phone,
        name: '重複客戶',
        email: 'duplicate@example.com',
        tags: [],
        marketingConsent: false,
      };

      return request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${userToken}`)
        .send(customerData)
        .expect(400);
    });

    it('應該驗證必填欄位', () => {
      const invalidData = {
        // 缺少 phone 和 name
        email: 'invalid@example.com',
      };

      return request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData)
        .expect(400);
    });
  });

  describe('GET /customers/:phone', () => {
    it('應該返回指定客戶詳情', async () => {
      const customer = await createTestCustomer(prisma, '0967890123');

      return request(app.getHttpServer())
        .get(`/customers/${customer.phone}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.phone).toBe(customer.phone);
          expect(res.body.name).toBe(customer.name);
        });
    });

    it('不存在的客戶應該返回 404', () => {
      return request(app.getHttpServer())
        .get('/customers/0999999999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  describe('PATCH /customers/:phone', () => {
    it('應該成功更新客戶資料', async () => {
      const customer = await createTestCustomer(prisma, '0978901234');
      const updateData = {
        name: '更新後的名稱',
        email: 'updated@example.com',
      };

      return request(app.getHttpServer())
        .patch(`/customers/${customer.phone}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe(updateData.name);
          expect(res.body.email).toBe(updateData.email);
        });
    });
  });

  describe('DELETE /customers/:phone', () => {
    it('經理應該能刪除客戶', async () => {
      const customer = await createTestCustomer(prisma, '0989012345');

      return request(app.getHttpServer())
        .delete(`/customers/${customer.phone}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);
    });

    it('一般員工應該被拒絕刪除客戶', async () => {
      const customer = await createTestCustomer(prisma, '0990123456');

      return request(app.getHttpServer())
        .delete(`/customers/${customer.phone}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('POST /customers/merge', () => {
    it('經理應該能合併客戶', async () => {
      const customer1 = await createTestCustomer(prisma, '0901234567');
      const customer2 = await createTestCustomer(prisma, '0901234568');

      const mergeData = {
        targetPhone: customer1.phone,
        sourcePhones: [customer2.phone],
      };

      return request(app.getHttpServer())
        .post('/customers/merge')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(mergeData)
        .expect(200);
    });

    it('一般員工應該被拒絕合併客戶', async () => {
      const customer1 = await createTestCustomer(prisma, '0901234569');
      const customer2 = await createTestCustomer(prisma, '0901234570');

      const mergeData = {
        targetPhone: customer1.phone,
        sourcePhones: [customer2.phone],
      };

      return request(app.getHttpServer())
        .post('/customers/merge')
        .set('Authorization', `Bearer ${userToken}`)
        .send(mergeData)
        .expect(403);
    });
  });

  describe('GET /customers/export', () => {
    it('經理應該能匯出客戶資料', async () => {
      await createTestCustomer(prisma, '0912345000');
      await createTestCustomer(prisma, '0912345001');

      return request(app.getHttpServer())
        .get('/customers/export')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.headers['content-type']).toContain('text/csv');
          expect(res.headers['content-disposition']).toContain('attachment');
        });
    });

    it('一般員工應該被拒絕匯出', () => {
      return request(app.getHttpServer())
        .get('/customers/export')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });
});