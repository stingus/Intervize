import { Processor, Process, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { EmailService } from '../email.service';
import { EmailJobData } from '../interfaces/email-options.interface';
import { PrismaService } from '../../config/prisma.service';

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    private emailService: EmailService,
    private prisma: PrismaService,
  ) {}

  @Process('send-email')
  async handleSendEmail(job: Job<EmailJobData>) {
    this.logger.log(`Processing email job ${job.id} for notification ${job.data.notificationLogId}`);

    try {
      // Send the email
      await this.emailService.sendEmail(job.data.emailOptions);

      // Update notification log to sent
      await this.prisma.notificationLog.update({
        where: { id: job.data.notificationLogId },
        data: {
          status: 'sent',
          sentAt: new Date(),
        },
      });

      this.logger.log(`Email sent successfully for notification ${job.data.notificationLogId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to send email for notification ${job.data.notificationLogId}:`,
        error,
      );

      // Update notification log to failed
      await this.prisma.notificationLog.update({
        where: { id: job.data.notificationLogId },
        data: {
          status: 'failed',
          failedAt: new Date(),
          errorMessage: error.message || 'Unknown error',
          retryCount: { increment: 1 },
        },
      });

      throw error;
    }
  }

  @Process('send-overdue-notification')
  async handleOverdueNotification(job: Job<{ checkoutId: string }>) {
    this.logger.log(`Processing overdue notification job ${job.id} for checkout ${job.data.checkoutId}`);

    try {
      // Fetch checkout with user and laptop details
      const checkout = await this.prisma.checkout.findUnique({
        where: { id: job.data.checkoutId },
        include: {
          user: true,
          laptop: true,
        },
      });

      if (!checkout || checkout.status !== 'active') {
        this.logger.warn(`Checkout ${job.data.checkoutId} not found or not active`);
        return { success: false, reason: 'Checkout not active' };
      }

      // Create notification log
      const notificationLog = await this.prisma.notificationLog.create({
        data: {
          notificationType: 'overdue',
          recipientEmail: checkout.user.email,
          recipientUserId: checkout.user.id,
          subject: `Reminder: Overdue Laptop Check-in Required - ${checkout.laptop.uniqueId}`,
          body: `Laptop ${checkout.laptop.uniqueId} is overdue for return`,
          relatedEntityType: 'checkout',
          relatedEntityId: checkout.id,
          status: 'pending',
        },
      });

      // Send the email
      await this.emailService.sendOverdueNotification(
        checkout.user.email,
        checkout.user.name,
        checkout.laptop.uniqueId,
        checkout.laptop.make,
        checkout.laptop.model,
        checkout.checkedOutAt,
      );

      // Update notification log
      await this.prisma.notificationLog.update({
        where: { id: notificationLog.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
        },
      });

      this.logger.log(`Overdue notification sent for checkout ${job.data.checkoutId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to send overdue notification for checkout ${job.data.checkoutId}:`,
        error,
      );
      throw error;
    }
  }

  @Process('send-lost-found-notification')
  async handleLostFoundNotification(job: Job<{ notificationLogId: string }>) {
    this.logger.log(`Processing lost/found notification job ${job.id}`);

    try {
      // Fetch notification log
      const notification = await this.prisma.notificationLog.findUnique({
        where: { id: job.data.notificationLogId },
      });

      if (!notification) {
        this.logger.warn(`Notification ${job.data.notificationLogId} not found`);
        return { success: false, reason: 'Notification not found' };
      }

      // Extract laptop info from the body
      const laptopIdMatch = notification.body?.match(/laptop (\S+)/i);
      const laptopUniqueId = laptopIdMatch ? laptopIdMatch[1] : 'Unknown';

      // Send the email
      await this.emailService.sendEmail({
        to: notification.recipientEmail,
        subject: notification.subject,
        text: notification.body || undefined,
      });

      // Update notification log
      await this.prisma.notificationLog.update({
        where: { id: notification.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
        },
      });

      this.logger.log(`Lost/found notification sent for ${notification.id}`);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to send lost/found notification ${job.data.notificationLogId}:`,
        error,
      );

      // Update notification log
      await this.prisma.notificationLog.update({
        where: { id: job.data.notificationLogId },
        data: {
          status: 'failed',
          failedAt: new Date(),
          errorMessage: error.message || 'Unknown error',
          retryCount: { increment: 1 },
        },
      });

      throw error;
    }
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(`Job ${job.id} completed with result:`, result);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed:`, error);
  }
}
