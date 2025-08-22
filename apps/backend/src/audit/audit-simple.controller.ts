import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { SimpleJwtAuthGuard } from '../auth/guards/simple-jwt-auth.guard';

@UseGuards(SimpleJwtAuthGuard)
@Controller('audit')
export class AuditSimpleController {
  @Get()
  async findAll(@Query() query: any, @Request() req: any) {
    return { 
      data: [
        {
          id: '1',
          action: 'CREATE_CUSTOMER',
          entity: 'Customer',
          entityId: 'cust-123',
          userId: req.user.id,
          userEmail: req.user.email,
          changes: { name: '新客戶' },
          timestamp: new Date().toISOString()
        }
      ], 
      total: 1,
      page: 1,
      limit: 20
    };
  }

  @Get('export')
  async export(@Query() query: any, @Request() req: any) {
    return { success: true, message: '稽核記錄匯出成功' };
  }
}