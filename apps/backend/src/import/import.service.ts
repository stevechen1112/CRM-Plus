import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ImportService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  // TODO: Implement CSV/Excel import functionality
}