import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@crm.com' },
    update: { password: adminPassword },
    create: {
      email: 'admin@crm.com',
      name: 'System Admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // Create manager user
  const managerPassword = await bcrypt.hash('manager123', 12);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@crm.com' },
    update: { password: managerPassword },
    create: {
      email: 'manager@crm.com',
      name: 'Sales Manager',
      password: managerPassword,
      role: 'MANAGER',
    },
  });

  // Create staff users
  const staffPassword = await bcrypt.hash('staff123', 12);
  const staffUser1 = await prisma.user.upsert({
    where: { email: 'staff@crm.com' },
    update: { password: staffPassword },
    create: {
      email: 'staff@crm.com',
      name: '王小美',
      password: staffPassword,
      role: 'STAFF',
    },
  });

  const staffUser2 = await prisma.user.upsert({
    where: { email: 'staff2@crm.com' },
    update: { password: staffPassword },
    create: {
      email: 'staff2@crm.com',
      name: '李大明',
      password: staffPassword,
      role: 'STAFF',
    },
  });

  console.log('✅ Created users:', {
    admin: admin.email,
    manager: manager.email,
    staff1: staffUser1.email,
    staff2: staffUser2.email,
  });

  // Create sample customers (following Taiwan phone format)
  const sampleCustomers = [
    {
      phone: '0912345678',
      name: '張三',
      email: 'zhang.san@example.com',
      source: 'Facebook',
      tags: ['VIP', '老客戶'],
      region: '台北市',
      marketingConsent: true,
      notes: '第一次購買是透過FB廣告',
    },
    {
      phone: '0923456789',
      name: '李四',
      email: 'li.si@example.com',
      lineId: 'lisi123',
      source: '朋友介紹',
      tags: ['新客戶'],
      region: '新北市',
      marketingConsent: true,
    },
    {
      phone: '0934567890',
      name: '王五',
      source: '官方網站',
      tags: ['潛在客戶'],
      region: '桃園市',
      marketingConsent: false,
    },
    {
      phone: '0945678901',
      name: '趙六',
      email: 'zhao.liu@example.com',
      facebookUrl: 'https://facebook.com/zhaoliu',
      source: '展覽會',
      tags: ['企業客戶', 'B2B'],
      region: '台中市',
      marketingConsent: true,
      notes: '2023台中展覽會認識，公司採購負責人',
    },
    {
      phone: '0956789012',
      name: '孫七',
      email: 'sun.qi@example.com',
      source: 'Google搜尋',
      tags: ['回購客戶'],
      region: '高雄市',
      marketingConsent: true,
    },
  ];

  for (const customerData of sampleCustomers) {
    await prisma.customer.upsert({
      where: { phone: customerData.phone },
      update: {},
      create: customerData,
    });
  }

  console.log('✅ Created sample customers');

  // Create sample orders
  const customer1 = await prisma.customer.findUnique({
    where: { phone: '0912345678' },
  });
  const customer2 = await prisma.customer.findUnique({
    where: { phone: '0923456789' },
  });
  const customer4 = await prisma.customer.findUnique({
    where: { phone: '0945678901' },
  });

  if (customer1) {
    const order1 = await prisma.order.create({
      data: {
        orderNo: 'ORD20240101001',
        customerPhone: customer1.phone,
        totalAmount: 15800,
        paymentStatus: 'PAID',
        orderStatus: 'DELIVERED',
        paymentMethod: '信用卡',
        deliveryMethod: '宅配',
        deliveryAddress: '台北市大安區復興南路一段123號',
        notes: '客戶要求加急配送',
        items: {
          create: [
            {
              productName: '無線藍牙耳機',
              quantity: 2,
              unitPrice: 3900,
              totalPrice: 7800,
            },
            {
              productName: '手機保護殼',
              quantity: 4,
              unitPrice: 2000,
              totalPrice: 8000,
            },
          ],
        },
      },
    });

    const order2 = await prisma.order.create({
      data: {
        orderNo: 'ORD20240115002',
        customerPhone: customer1.phone,
        totalAmount: 25600,
        paymentStatus: 'PAID',
        orderStatus: 'DELIVERED',
        paymentMethod: 'ATM轉帳',
        deliveryMethod: '宅配',
        deliveryAddress: '台北市大安區復興南路一段123號',
        createdAt: new Date('2024-01-15'),
        items: {
          create: [
            {
              productName: '智慧手錶',
              quantity: 1,
              unitPrice: 25600,
              totalPrice: 25600,
            },
          ],
        },
      },
    });

    console.log('✅ Created orders for customer 1');
  }

  if (customer2) {
    await prisma.order.create({
      data: {
        orderNo: 'ORD20240120003',
        customerPhone: customer2.phone,
        totalAmount: 8900,
        paymentStatus: 'PAID',
        orderStatus: 'SHIPPED',
        paymentMethod: '貨到付款',
        deliveryMethod: '宅配',
        deliveryAddress: '新北市板橋區文化路二段456號',
        createdAt: new Date('2024-01-20'),
        items: {
          create: [
            {
              productName: '行動電源',
              quantity: 1,
              unitPrice: 2900,
              totalPrice: 2900,
            },
            {
              productName: '充電線組合',
              quantity: 2,
              unitPrice: 3000,
              totalPrice: 6000,
            },
          ],
        },
      },
    });

    console.log('✅ Created orders for customer 2');
  }

  if (customer4) {
    await prisma.order.create({
      data: {
        orderNo: 'ORD20240125004',
        customerPhone: customer4.phone,
        totalAmount: 125000,
        paymentStatus: 'PAID',
        orderStatus: 'DELIVERED',
        paymentMethod: '公司轉帳',
        deliveryMethod: '企業配送',
        deliveryAddress: '台中市西屯區台灣大道三段789號',
        createdAt: new Date('2024-01-25'),
        notes: '企業大單，需要統一發票',
        items: {
          create: [
            {
              productName: '辦公室音響系統',
              quantity: 5,
              unitPrice: 25000,
              totalPrice: 125000,
            },
          ],
        },
      },
    });

    console.log('✅ Created orders for customer 4');
  }

  // Create sample interactions
  await prisma.interaction.create({
    data: {
      customerPhone: '0912345678',
      channel: 'PHONE',
      summary: '客戶詢問藍牙耳機保固期限和維修服務',
      notes: '客戶對產品很滿意，考慮再購買同款給家人使用',
      userId: staffUser1.id,
    },
  });

  await prisma.interaction.create({
    data: {
      customerPhone: '0923456789',
      channel: 'LINE',
      summary: '客戶詢問新產品上市時間',
      notes: '對智慧手錶很感興趣，請求加入新品通知名單',
      userId: staffUser2.id,
    },
  });

  console.log('✅ Created sample interactions');

  // Create sample tasks
  await prisma.task.create({
    data: {
      customerPhone: '0934567890',
      title: '跟進潛在客戶王五',
      description: '客戶已瀏覽官網產品頁面多次，需主動聯繫了解需求',
      type: 'FOLLOW_UP',
      priority: 'HIGH',
      assigneeId: staffUser1.id,
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    },
  });

  await prisma.task.create({
    data: {
      customerPhone: '0912345678',
      title: '客戶關懷電話',
      description: '購買後滿意度調查和後續需求了解',
      type: 'CARE_CALL',
      priority: 'MEDIUM',
      assigneeId: staffUser2.id,
      dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    },
  });

  await prisma.task.create({
    data: {
      customerPhone: '0956789012',
      title: '回購提醒',
      description: '上次購買已超過30天，可推薦新品或優惠活動',
      type: 'REPURCHASE',
      priority: 'MEDIUM',
      assigneeId: staffUser1.id,
      dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
  });

  console.log('✅ Created sample tasks');

  // Create automation rules
  await prisma.automationRule.create({
    data: {
      name: '新名單24小時跟進',
      description: '新客戶建檔後24小時內未有交流紀錄，自動建立跟進任務',
      trigger: JSON.stringify({ type: 'new_customer', hours: 24 }),
      conditions: JSON.stringify({ customerType: 'new', hasInteraction: false }),
      action: JSON.stringify({
        taskType: 'FOLLOW_UP',
        title: '新客戶跟進',
        description: '新客戶建檔超過24小時，請主動聯繫了解需求',
        priority: 'HIGH',
      }),
    },
  });

  await prisma.automationRule.create({
    data: {
      name: '成交後3天關懷',
      description: '訂單完成後3天自動建立關懷任務',
      trigger: JSON.stringify({ type: 'order_completed', days: 3 }),
      conditions: JSON.stringify({ orderStatus: 'DELIVERED' }),
      action: JSON.stringify({
        taskType: 'CARE_CALL',
        title: '售後關懷電話',
        description: '訂單完成後關懷，了解使用狀況和滿意度',
        priority: 'MEDIUM',
      }),
    },
  });

  console.log('✅ Created automation rules');

  // Create sample RFM analysis
  await prisma.rfmAnalysis.create({
    data: {
      customerPhone: '0912345678',
      recency: 15, // 15 days since last order
      frequency: 2, // 2 total orders
      monetary: 41400, // Total spent: 15800 + 25600
      rScore: 5,
      fScore: 3,
      mScore: 5,
      rfmScore: '535',
      segment: 'CHAMPIONS',
    },
  });

  await prisma.rfmAnalysis.create({
    data: {
      customerPhone: '0923456789',
      recency: 30,
      frequency: 1,
      monetary: 8900,
      rScore: 4,
      fScore: 2,
      mScore: 3,
      rfmScore: '423',
      segment: 'PROMISING',
    },
  });

  console.log('✅ Created sample RFM analysis');

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });