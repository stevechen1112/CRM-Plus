import { Module } from '@nestjs/common';
import { StatsSimpleController } from './stats-simple.controller';

@Module({
  controllers: [StatsSimpleController],
})
export class StatsModule {}