import { Module } from '@nestjs/common';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { PrismaService } from '../common/services/prisma.service';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [ImportController],
  providers: [ImportService, PrismaService, AuditService],
  exports: [ImportService],
})
export class ImportModule {}