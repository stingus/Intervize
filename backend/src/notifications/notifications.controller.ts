import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { NotificationFiltersDto } from './dto/notification-filters.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // Get notification history (admin only)
  @Get('history')
  @Roles('admin')
  async getHistory(@Query() filters: NotificationFiltersDto) {
    return this.notificationsService.getNotificationHistory(filters);
  }

  // Get notification statistics (admin only)
  @Get('stats')
  @Roles('admin')
  async getStats() {
    return this.notificationsService.getNotificationStats();
  }

  // Manually trigger overdue check (admin only, for testing)
  @Post('check-overdue')
  @Roles('admin')
  async checkOverdue() {
    return this.notificationsService.triggerOverdueCheck();
  }

  // Process pending lost/found notifications (admin only, for testing)
  @Post('process-lost-found')
  @Roles('admin')
  async processLostFound() {
    return this.notificationsService.processPendingLostFoundNotifications();
  }

  // Retry failed notifications (admin only)
  @Post('retry-failed')
  @Roles('admin')
  async retryFailed() {
    return this.notificationsService.retryFailedNotifications();
  }
}
