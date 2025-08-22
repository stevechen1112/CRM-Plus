import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { SimpleJwtAuthGuard } from '../auth/guards/simple-jwt-auth.guard';

@UseGuards(SimpleJwtAuthGuard)
@Controller('users')
export class UsersSimpleController {
  @Get()
  async findAll(@Query() query: any, @Request() req: any) {
    return { 
      data: [
        {
          id: '1',
          email: 'admin@crm.com',
          name: 'System Admin',
          role: 'ADMIN',
          isActive: true,
          lastLoginAt: new Date(Date.now() - 3600000).toISOString(), // 1小時前
          createdAt: new Date().toISOString()
        },
        {
          id: '2', 
          email: 'manager@crm.com',
          name: 'Manager User',
          role: 'MANAGER',
          isActive: true,
          lastLoginAt: new Date(Date.now() - 86400000).toISOString(), // 1天前
          createdAt: new Date().toISOString()
        }
      ], 
      total: 2 
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return { 
      id, 
      email: 'user@crm.com',
      name: 'Test User',
      role: 'STAFF',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  @Post()
  async create(@Body() createUserDto: any, @Request() req: any) {
    return { 
      success: true, 
      data: { 
        id: 'user-' + Date.now(), 
        ...createUserDto,
        createdAt: new Date().toISOString()
      } 
    };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: any, @Request() req: any) {
    return { success: true, data: { id, ...updateUserDto, updatedAt: new Date().toISOString() } };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    return { success: true, message: '用戶已刪除' };
  }
}