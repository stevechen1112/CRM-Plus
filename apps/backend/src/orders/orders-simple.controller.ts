import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { SimpleJwtAuthGuard } from '../auth/guards/simple-jwt-auth.guard';

@UseGuards(SimpleJwtAuthGuard)
@Controller('orders')
export class OrdersSimpleController {
  @Get()
  async findAll(@Query() query: any, @Request() req: any) {
    return { 
      data: [
        {
          id: 'order-1',
          orderNo: 'ORD-2025001',
          customerPhone: '0912345678',
          totalAmount: '1500',
          status: 'COMPLETED',
          orderStatus: 'COMPLETED',
          paymentStatus: 'PAID',
          items: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ], 
      total: 1, 
      page: 1, 
      limit: 20 
    };
  }

  @Get('stats')
  async getStats(@Query() query: any, @Request() req: any) {
    return { totalRevenue: '0', avgOrderValue: '0', count: 0 };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return { 
      id,
      orderNo: 'ORD-' + Date.now(),
      customerPhone: '0912345678',
      totalAmount: '1000',
      status: 'PENDING',
      orderStatus: 'PENDING',
      paymentStatus: 'PENDING',
      paymentMethod: 'CASH',
      deliveryMethod: 'PICKUP',
      deliveryAddress: '台北市中正區',
      notes: '範例訂單',
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  @Post()
  async create(@Body() createOrderDto: any, @Request() req: any) {
    return { 
      success: true, 
      data: { 
        id: 'order-' + Date.now(), 
        ...createOrderDto,
        createdAt: new Date().toISOString()
      } 
    };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateOrderDto: any, @Request() req: any) {
    return { success: true, data: { id, ...updateOrderDto, updatedAt: new Date().toISOString() } };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    return { success: true, message: '訂單已刪除' };
  }
}