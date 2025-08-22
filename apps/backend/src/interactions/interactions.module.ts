import { Module } from '@nestjs/common';
import { InteractionsSimpleController } from './interactions-simple.controller';

@Module({
  controllers: [InteractionsSimpleController],
})
export class InteractionsModule {}