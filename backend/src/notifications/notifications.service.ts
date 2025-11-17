import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../config/prisma.service';
import { ConfigService } from '@nestjs/config';
import { EmailJobData } from './interfaces/email-options.interface';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectQueue('email') private emailQueue: Queue,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  // Queue a generic email
  async queueEmail(jobData: EmailJobData) {
    const job = await this.emailQueue.add('send-email', jobData, {
      attempts: parseInt(this.configService.get('BULL_QUEUE_EMAIL_ATTEMPTS', '3')),
      backoff: {
        type: this.configService.get('BULL_QUEUE_EMAIL_BACKOFF', 'exponential'),
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });

    this.logger.log(`Email job queued with ID: ${job.id}`);
    return job;
  }

  // Process pending lost/found notifications
  async processPendingLostFoundNotifications() {
    const pendingNotifications = await this.prisma.notificationLog.findMany({
      where: {
        notificationType: 'lost_found',
        status: 'pending',
      },
      take: 50, // Process in batches
    });

    this.logger.log(`Found ${pendingNotifications.length} pending lost/found notifications`);

    for (const notification of pendingNotifications) {
      await this.emailQueue.add(
        'send-lost-found-notification',
        { notificationLogId: notification.id },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: true,
        },
      );
    }

    return { processed: pendingNotifications.length };
  }

  // Check for overdue checkouts and send notifications (runs every hour)
  @Cron(CronExpression.EVERY_HOUR)
  async checkOverdueCheckouts() {
    this.logger.log('Running scheduled overdue checkout check...');

    try {
      // Get overdue threshold from env (default 24 hours = 1440 minutes)
      const thresholdMinutes = parseInt(
        this.configService.get('OVERDUE_THRESHOLD_MINUTES', '1440'),
      );
      const thresholdDate = new Date(Date.now() - thresholdMinutes * 60 * 1000);

      // Find overdue checkouts
      const overdueCheckouts = await this.prisma.checkout.findMany({
        where: {
          status: 'active',
          checkedOutAt: {
            lt: thresholdDate,
          },
        },
        include: {
          user: true,
          laptop: true,
        },
      });

      this.logger.log(`Found ${overdueCheckouts.length} overdue checkouts`);

      // Check which checkouts already received a notification in the last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      for (const checkout of overdueCheckouts) {
        // Check if we've already sent a notification recently
        const recentNotification = await this.prisma.notificationLog.findFirst({
          where: {
            notificationType: 'overdue',
            recipientUserId: checkout.userId,
            relatedEntityType: 'checkout',
            relatedEntityId: checkout.id,
            createdAt: {
              gte: oneDayAgo,
            },
          },
        });

        if (recentNotification) {
          this.logger.log(
            `Skipping checkout ${checkout.id} - notification already sent in last 24 hours`,
          );
          continue;
        }

        // Queue overdue notification
        await this.emailQueue.add(
          'send-overdue-notification',
          { checkoutId: checkout.id },
          {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000,
            },
            removeOnComplete: true,
          },
        );

        this.logger.log(`Queued overdue notification for checkout ${checkout.id}`);
      }

      return { overdueCount: overdueCheckouts.length };
    } catch (error) {
      this.logger.error('Error in checkOverdueCheckouts:', error);
      throw error;
    }
  }

  // Manual trigger for testing
  async triggerOverdueCheck() {
    this.logger.log('Manually triggering overdue checkout check...');
    return this.checkOverdueCheckouts();
  }

  // Get notification history
  async getNotificationHistory(filters?: {
    userId?: string;
    notificationType?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const { userId, notificationType, status, limit = 50, offset = 0 } = filters || {};

    const where: any = {};

    if (userId) {
      where.recipientUserId = userId;
    }

    if (notificationType) {
      where.notificationType = notificationType;
    }

    if (status) {
      where.status = status;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notificationLog.findMany({
        where,
        include: {
          recipientUser: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.notificationLog.count({ where }),
    ]);

    return {
      notifications,
      total,
      limit,
      offset,
    };
  }

  // Get notification statistics
  async getNotificationStats() {
    const [
      totalSent,
      totalFailed,
      totalPending,
      byType,
    ] = await Promise.all([
      this.prisma.notificationLog.count({ where: { status: 'sent' } }),
      this.prisma.notificationLog.count({ where: { status: 'failed' } }),
      this.prisma.notificationLog.count({ where: { status: 'pending' } }),
      this.prisma.notificationLog.groupBy({
        by: ['notificationType'],
        _count: {
          id: true,
        },
      }),
    ]);

    return {
      total: totalSent + totalFailed + totalPending,
      sent: totalSent,
      failed: totalFailed,
      pending: totalPending,
      byType: byType.reduce((acc, item) => {
        acc[item.notificationType] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  // Retry failed notifications
  async retryFailedNotifications(maxRetries: number = 3) {
    const failedNotifications = await this.prisma.notificationLog.findMany({
      where: {
        status: 'failed',
        retryCount: {
          lt: maxRetries,
        },
      },
      take: 20, // Process in batches
    });

    this.logger.log(`Retrying ${failedNotifications.length} failed notifications`);

    for (const notification of failedNotifications) {
      // Reset status to pending
      await this.prisma.notificationLog.update({
        where: { id: notification.id },
        data: {
          status: 'pending',
          errorMessage: null,
        },
      });

      // Queue based on type
      if (notification.notificationType === 'lost_found') {
        await this.emailQueue.add('send-lost-found-notification', {
          notificationLogId: notification.id,
        });
      } else if (notification.notificationType === 'overdue') {
        // For overdue, we need to get the checkout ID from relatedEntityId
        if (notification.relatedEntityId) {
          await this.emailQueue.add('send-overdue-notification', {
            checkoutId: notification.relatedEntityId,
          });
        }
      }
    }

    return { retried: failedNotifications.length };
  }
}
