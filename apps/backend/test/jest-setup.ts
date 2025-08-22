import { PrismaService } from '../src/common/services/prisma.service';

let prisma: PrismaService;

beforeAll(async () => {
  // 設定測試資料庫
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/crm_test';
  process.env.NODE_ENV = 'test';
  
  prisma = new PrismaService();
  await prisma.$connect();
});

beforeEach(async () => {
  // 每個測試前清理資料庫
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
      } catch (error) {
        console.log(`Error truncating ${tablename}:`, error);
      }
    }
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

// 全域測試工具
global.testPrisma = prisma;