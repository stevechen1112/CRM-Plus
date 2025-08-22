import { Module } from '@nestjs/common';
import { OrdersSimpleController } from './orders-simple.controller';

@Module({
  controllers: [OrdersSimpleController],
})
export class OrdersModule {}