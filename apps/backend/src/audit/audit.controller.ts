import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { SimpleJwtAuthGuard } from '../auth/guards/simple-jwt-auth.guard';
import { AuditLogQueryDto } from './dto/audit.dto';
import { ApiResponse as ApiResponseType, PaginatedResponse } from '@crm/shared';

@UseGuards(SimpleJwtAuthGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  async getLogs(@Query() query: AuditLogQueryDto): Promise<ApiResponseType<PaginatedResponse<any>>> {
    const result = await this.auditService.getLogs({
      page: query.page,
      limit: query.limit,
      userId: query.userId,
      action: query.action,
      entity: query.entity,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    });

    return {
      success: true,
      data: result,
    };
  }

  @Get('logins')
  async getLoginLogs(@Query() query: AuditLogQueryDto): Promise<ApiResponseType<PaginatedResponse<any>>> {
    const result = await this.auditService.getLoginLogs({
      page: query.page,
      limit: query.limit,
      userId: query.userId,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    });

    return {
      success: true,
      data: result,
    };
  }
}