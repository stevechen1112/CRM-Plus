import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';

// Controllers
import { AppController } from './app.controller';

// Core modules
import { PrismaModule } from './common/services/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { OrdersModule } from './orders/orders.module';
import { InteractionsModule } from './interactions/interactions.module';
import { TasksModule } from './tasks/tasks.module';
import { ImportModule } from './import/import.module';
import { ImportExportModule } from './import-export/import-export.module';
import { AuditModule } from './audit/audit.module';
import { NotificationsModule } from './notifications/notifications.module';
import { StatsModule } from './stats/stats.module';
import { UsersModule } from './users/users.module';

@Module({
  controllers: [AppController],
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Task scheduling
    ScheduleModule.forRoot(),

    // Bull queue for background jobs
    BullModule.forRootAsync({
      useFactory: () => ({
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD,
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      }),
    }),

    // Core services
    PrismaModule,

    // Feature modules
    AuthModule,
    UsersModule,
    CustomersModule,
    OrdersModule,
    InteractionsModule,
    TasksModule,
    ImportModule,
    ImportExportModule,
    AuditModule,
    NotificationsModule,
    StatsModule,
  ],
})
export class AppModule {}