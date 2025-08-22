import { Module } from '@nestjs/common';
import { AuditSimpleController } from './audit-simple.controller';

@Module({
  controllers: [AuditSimpleController],
})
export class AuditModule {}