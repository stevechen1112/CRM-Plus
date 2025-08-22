import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { SimpleJwtAuthGuard } from '../auth/guards/simple-jwt-auth.guard';

@UseGuards(SimpleJwtAuthGuard)
@Controller('tasks')
export class TasksSimpleController {
  @Get()
  async findAll(@Query() query: any, @Request() req: any) {
    return { data: [], total: 0, page: 1, limit: 20 };
  }

  @Get('automation/trigger')
  async triggerAutomation(@Request() req: any) {
    return { success: true, message: '自動化規則已觸發' };
  }

  @Get('my')
  async getMyTasks(@Query() query: any, @Request() req: any) {
    return { data: [], total: 0 };
  }

  @Get('stats')
  async getStats(@Query() query: any, @Request() req: any) {
    return { created: 0, completed: 0, pending: 0, inProgress: 0 };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return { 
      id, 
      title: '範例任務', 
      description: '這是一個範例任務',
      status: 'PENDING',
      priority: 'MEDIUM',
      type: 'FOLLOW_UP',
      dueAt: new Date(Date.now() + 86400000).toISOString(), // 明天
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  @Post()
  async create(@Body() createTaskDto: any, @Request() req: any) {
    return { 
      success: true, 
      data: { 
        id: 'task-' + Date.now(), 
        ...createTaskDto,
        createdAt: new Date().toISOString()
      } 
    };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateTaskDto: any, @Request() req: any) {
    return { success: true, data: { id, ...updateTaskDto, updatedAt: new Date().toISOString() } };
  }

  @Patch(':id/complete')
  async complete(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return { success: true, message: '任務已完成' };
  }

  @Patch(':id/defer')
  async defer(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return { success: true, message: '任務已延後' };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    return { success: true, message: '任務已刪除' };
  }
}