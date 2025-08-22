import { Module } from '@nestjs/common';
import { TasksSimpleController } from './tasks-simple.controller';

@Module({
  controllers: [TasksSimpleController],
})
export class TasksModule {}