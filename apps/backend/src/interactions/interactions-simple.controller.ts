import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { SimpleJwtAuthGuard } from '../auth/guards/simple-jwt-auth.guard';

@UseGuards(SimpleJwtAuthGuard)
@Controller('interactions')
export class InteractionsSimpleController {
  @Get()
  async findAll(@Query() query: any, @Request() req: any) {
    return { data: [], total: 0, page: 1, limit: 20 };
  }

  @Get('customer/:customerPhone')
  async getCustomerInteractions(@Param('customerPhone') customerPhone: string, @Query() query: any) {
    return { data: [], total: 0 };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return { 
      id, 
      customerPhone: '0912345678',
      channel: 'PHONE',
      type: 'INBOUND',
      summary: '客戶諮詢',
      notes: '客戶詢問產品資訊',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  @Post()
  async create(@Body() createInteractionDto: any, @Request() req: any) {
    return { 
      success: true, 
      data: { 
        id: 'interaction-' + Date.now(), 
        ...createInteractionDto,
        createdAt: new Date().toISOString()
      } 
    };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateInteractionDto: any, @Request() req: any) {
    return { success: true, data: { id, ...updateInteractionDto, updatedAt: new Date().toISOString() } };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    return { success: true, message: '交流記錄已刪除' };
  }
}