import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EmailService } from './email.service';
import { EmailProcessor } from './processors/email.processor';
import { PrismaService } from '../config/prisma.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email',
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    EmailService,
    EmailProcessor,
    PrismaService,
  ],
  exports: [NotificationsService, EmailService],
})
export class NotificationsModule {}
