import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { SimpleJwtAuthGuard } from '../auth/guards/simple-jwt-auth.guard';

@UseGuards(SimpleJwtAuthGuard)
@Controller('notifications')
export class NotificationsSimpleController {
  @Get()
  async getMyNotifications(@Request() req: any) {
    return {
      success: true,
      data: [],
    };
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    return {
      success: true,
      data: { count: 0 },
    };
  }
}