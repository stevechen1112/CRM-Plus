import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsStubService } from './notifications-stub.service';
import { SimpleJwtAuthGuard } from '../auth/guards/simple-jwt-auth.guard';
import { ApiResponse as ApiResponseType } from '@crm/shared';

@UseGuards(SimpleJwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsStubService) {}

  @Get()
  async getMyNotifications(
    @Request() req: any,
    @Query('limit') limit?: number,
  ): Promise<ApiResponseType<any[]>> {
    const notifications = await this.notificationsService.getInAppNotifications(
      req.user.id, 
      limit
    );

    return {
      success: true,
      data: notifications,
    };
  }

  @Get('unread-count')
  async getUnreadCount(
    @Request() req: any,
  ): Promise<ApiResponseType<{ count: number }>> {
    const count = await this.notificationsService.getUnreadNotificationCount(req.user.id);

    return {
      success: true,
      data: { count },
    };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<ApiResponseType<null>> {
    await this.notificationsService.markNotificationAsRead(id, req.user.id);

    return {
      success: true,
      data: null,
      message: 'Notification marked as read',
    };
  }

  @Post('mark-all-read')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(
    @Request() req: any,
  ): Promise<ApiResponseType<null>> {
    await this.notificationsService.markAllNotificationsAsRead(req.user.id);

    return {
      success: true,
      data: null,
      message: 'All notifications marked as read',
    };
  }
}