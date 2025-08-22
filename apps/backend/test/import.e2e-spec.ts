import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/services/prisma.service';
import { createTestUser } from './test-utils';
import * as path from 'path';
import * as fs from 'fs';

describe('Import API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let managerToken: string;
  let userToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    
    await app.init();

    // 建立測試用戶
    const manager = await createTestUser(prisma, 'MANAGER');
    const user = await createTestUser(prisma, 'STAFF');

    // 模擬 token
    managerToken = 'mock-manager-token';
    userToken = 'mock-user-token';
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /import/preview', () => {
    beforeEach(() => {
      // 建立測試 CSV 檔案
      const customersCsvContent = `name,phone,email,tags,region
王小明,0912345678,wang@example.com,VIP,台北
李小華,0923456789,lee@example.com,新客戶,台中
張小強,0934567890,zhang@example.com,"VIP,老客戶",高雄`;

      fs.writeFileSync('/tmp/test-customers.csv', customersCsvContent);

      const ordersCsvContent = `orderNo,customerPhone,productName,quantity,unitPrice,paymentMethod
ORD001,0912345678,商品A,2,500,信用卡
ORD002,0923456789,商品B,1,1000,現金
ORD003,0934567890,商品C,3,300,轉帳`;

      fs.writeFileSync('/tmp/test-orders.csv', ordersCsvContent);
    });

    afterEach(() => {
      // 清理測試檔案
      if (fs.existsSync('/tmp/test-customers.csv')) {
        fs.unlinkSync('/tmp/test-customers.csv');
      }
      if (fs.existsSync('/tmp/test-orders.csv')) {
        fs.unlinkSync('/tmp/test-orders.csv');
      }
    });

    it('應該成功預覽客戶匯入', () => {
      return request(app.getHttpServer())
        .post('/import/preview')
        .set('Authorization', `Bearer ${managerToken}`)
        .attach('file', '/tmp/test-customers.csv')
        .field('type', 'customers')
        .expect(200)
        .expect((res) => {
          expect(res.body.preview).toBeDefined();
          expect(res.body.preview).toHaveLength(3);
          expect(res.body.summary).toBeDefined();
          expect(res.body.summary.totalRecords).toBe(3);
          expect(res.body.summary.validRecords).toBe(3);
          expect(res.body.summary.invalidRecords).toBe(0);
        });
    });

    it('應該成功預覽訂單匯入', () => {
      return request(app.getHttpServer())
        .post('/import/preview')
        .set('Authorization', `Bearer ${managerToken}`)
        .attach('file', '/tmp/test-orders.csv')
        .field('type', 'orders')
        .expect(200)
        .expect((res) => {
          expect(res.body.preview).toBeDefined();
          expect(res.body.preview).toHaveLength(3);
          expect(res.body.summary).toBeDefined();
          expect(res.body.summary.totalRecords).toBe(3);
        });
    });

    it('應該檢測並報告無效資料', () => {
      const invalidCsvContent = `name,phone,email,tags,region
王小明,invalid-phone,wang@example.com,VIP,台北
,0923456789,lee@example.com,新客戶,台中
張小強,0934567890,invalid-email,"VIP,老客戶",高雄`;

      fs.writeFileSync('/tmp/test-invalid.csv', invalidCsvContent);

      return request(app.getHttpServer())
        .post('/import/preview')
        .set('Authorization', `Bearer ${managerToken}`)
        .attach('file', '/tmp/test-invalid.csv')
        .field('type', 'customers')
        .expect(200)
        .expect((res) => {
          expect(res.body.summary.totalRecords).toBe(3);
          expect(res.body.summary.validRecords).toBeLessThan(3);
          expect(res.body.summary.invalidRecords).toBeGreaterThan(0);
          expect(res.body.errors).toBeDefined();
          expect(res.body.errors.length).toBeGreaterThan(0);
        })
        .finally(() => {
          if (fs.existsSync('/tmp/test-invalid.csv')) {
            fs.unlinkSync('/tmp/test-invalid.csv');
          }
        });
    });

    it('一般員工應該被拒絕存取', () => {
      return request(app.getHttpServer())
        .post('/import/preview')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('file', '/tmp/test-customers.csv')
        .field('type', 'customers')
        .expect(403);
    });

    it('應該拒絕不支援的檔案類型', () => {
      const textFile = '/tmp/test.txt';
      fs.writeFileSync(textFile, 'This is not a CSV file');

      return request(app.getHttpServer())
        .post('/import/preview')
        .set('Authorization', `Bearer ${managerToken}`)
        .attach('file', textFile)
        .field('type', 'customers')
        .expect(400)
        .finally(() => {
          if (fs.existsSync(textFile)) {
            fs.unlinkSync(textFile);
          }
        });
    });
  });

  describe('POST /import/commit', () => {
    it('應該成功執行客戶匯入', async () => {
      // 首先進行預覽獲取 sessionId
      const previewResponse = await request(app.getHttpServer())
        .post('/import/preview')
        .set('Authorization', `Bearer ${managerToken}`)
        .attach('file', '/tmp/test-customers.csv')
        .field('type', 'customers');

      const sessionId = previewResponse.body.sessionId;

      return request(app.getHttpServer())
        .post('/import/commit')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          sessionId,
          options: {
            skipDuplicates: false,
            updateExisting: true,
          },
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.summary).toBeDefined();
          expect(res.body.summary.imported).toBeGreaterThan(0);
        });
    });

    it('應該成功執行訂單匯入', async () => {
      // 先建立客戶資料
      await prisma.customer.createMany({
        data: [
          {
            phone: '0912345678',
            name: '王小明',
            email: 'wang@example.com',
            tags: ['VIP'],
            marketingConsent: true,
          },
          {
            phone: '0923456789',
            name: '李小華',
            email: 'lee@example.com',
            tags: ['新客戶'],
            marketingConsent: true,
          },
          {
            phone: '0934567890',
            name: '張小強',
            email: 'zhang@example.com',
            tags: ['VIP', '老客戶'],
            marketingConsent: true,
          },
        ],
      });

      // 預覽訂單匯入
      const previewResponse = await request(app.getHttpServer())
        .post('/import/preview')
        .set('Authorization', `Bearer ${managerToken}`)
        .attach('file', '/tmp/test-orders.csv')
        .field('type', 'orders');

      const sessionId = previewResponse.body.sessionId;

      return request(app.getHttpServer())
        .post('/import/commit')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          sessionId,
          options: {
            skipDuplicates: true,
          },
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.summary.imported).toBeGreaterThan(0);
        });
    });

    it('應該處理重複資料選項', async () => {
      // 先建立一個客戶
      await prisma.customer.create({
        data: {
          phone: '0912345678',
          name: '現有客戶',
          email: 'existing@example.com',
          tags: ['現有'],
          marketingConsent: false,
        },
      });

      const previewResponse = await request(app.getHttpServer())
        .post('/import/preview')
        .set('Authorization', `Bearer ${managerToken}`)
        .attach('file', '/tmp/test-customers.csv')
        .field('type', 'customers');

      const sessionId = previewResponse.body.sessionId;

      // 測試更新現有客戶
      return request(app.getHttpServer())
        .post('/import/commit')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          sessionId,
          options: {
            skipDuplicates: false,
            updateExisting: true,
          },
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.summary.updated).toBeGreaterThan(0);
        });
    });

    it('應該拒絕無效的 sessionId', () => {
      return request(app.getHttpServer())
        .post('/import/commit')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          sessionId: 'invalid-session-id',
          options: {},
        })
        .expect(400);
    });

    it('一般員工應該被拒絕存取', () => {
      return request(app.getHttpServer())
        .post('/import/commit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          sessionId: 'any-session-id',
          options: {},
        })
        .expect(403);
    });
  });

  describe('GET /import/status/:sessionId', () => {
    it('應該返回匯入狀態', async () => {
      const previewResponse = await request(app.getHttpServer())
        .post('/import/preview')
        .set('Authorization', `Bearer ${managerToken}`)
        .attach('file', '/tmp/test-customers.csv')
        .field('type', 'customers');

      const sessionId = previewResponse.body.sessionId;

      return request(app.getHttpServer())
        .get(`/import/status/${sessionId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.sessionId).toBe(sessionId);
          expect(res.body.status).toBeDefined();
          expect(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).toContain(res.body.status);
        });
    });

    it('不存在的 sessionId 應該返回 404', () => {
      return request(app.getHttpServer())
        .get('/import/status/non-existent-session')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(404);
    });
  });

  describe('事務一致性測試', () => {
    it('匯入失敗時應該回滾所有變更', async () => {
      const invalidOrdersCsv = `orderNo,customerPhone,productName,quantity,unitPrice,paymentMethod
ORD001,0999999999,商品A,2,500,信用卡
ORD002,0888888888,商品B,1,1000,現金`;

      fs.writeFileSync('/tmp/test-invalid-orders.csv', invalidOrdersCsv);

      const previewResponse = await request(app.getHttpServer())
        .post('/import/preview')
        .set('Authorization', `Bearer ${managerToken}`)
        .attach('file', '/tmp/test-invalid-orders.csv')
        .field('type', 'orders');

      const sessionId = previewResponse.body.sessionId;

      // 記錄匯入前的訂單數量
      const ordersBefore = await prisma.order.count();

      await request(app.getHttpServer())
        .post('/import/commit')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          sessionId,
          options: {
            skipDuplicates: false,
          },
        })
        .expect(400);

      // 確認沒有部分資料被匯入
      const ordersAfter = await prisma.order.count();
      expect(ordersAfter).toBe(ordersBefore);

      // 清理測試檔案
      if (fs.existsSync('/tmp/test-invalid-orders.csv')) {
        fs.unlinkSync('/tmp/test-invalid-orders.csv');
      }
    });
  });
});