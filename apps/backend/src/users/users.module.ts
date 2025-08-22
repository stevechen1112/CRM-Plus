import { Module } from '@nestjs/common';
import { UsersSimpleController } from './users-simple.controller';

@Module({
  controllers: [UsersSimpleController],
})
export class UsersModule {}