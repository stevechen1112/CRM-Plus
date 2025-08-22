import { Module } from '@nestjs/common';
import { NotificationsSimpleController } from './notifications-simple.controller';

@Module({
  controllers: [NotificationsSimpleController],
})
export class NotificationsModule {}