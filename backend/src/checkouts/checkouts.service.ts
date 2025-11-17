import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../config/prisma.service';
import { CheckoutLaptopDto } from './dto/checkout-laptop.dto';
import { CheckinLaptopDto } from './dto/checkin-laptop.dto';
import { ReportLostDto } from './dto/report-lost.dto';
import { ReportFoundDto } from './dto/report-found.dto';
import { ErrorCode } from '../common/enums/error-codes.enum';

@Injectable()
export class CheckoutsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('email') private emailQueue: Queue,
  ) {}

  async checkout(checkoutDto: CheckoutLaptopDto) {
    // Find laptop by unique ID
    const laptop = await this.prisma.laptop.findFirst({
      where: {
        uniqueId: checkoutDto.laptopUniqueId,
        deletedAt: null,
      },
    });

    if (!laptop) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND_LAPTOP,
        message: 'Laptop not found',
      });
    }

    // Check if laptop is available
    if (laptop.status !== 'available') {
      throw new BadRequestException({
        code: ErrorCode.VAL_LAPTOP_NOT_AVAILABLE,
        message: `Laptop is not available for checkout. Current status: ${laptop.status}`,
      });
    }

    // Verify user exists
    const user = await this.prisma.user.findFirst({
      where: {
        id: checkoutDto.userId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND_USER,
        message: 'User not found',
      });
    }

    // Create checkout and update laptop status in a transaction
    const checkout = await this.prisma.$transaction(async (tx) => {
      // Create checkout record
      const newCheckout = await tx.checkout.create({
        data: {
          laptopId: laptop.id,
          userId: user.id,
          status: 'active',
        },
        include: {
          laptop: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
        },
      });

      // Update laptop status
      await tx.laptop.update({
        where: { id: laptop.id },
        data: { status: 'checked_out' },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'checkout',
          entityType: 'laptop',
          entityId: laptop.id,
          details: {
            laptopUniqueId: laptop.uniqueId,
            userEmail: user.email,
          },
        },
      });

      return newCheckout;
    });

    return checkout;
  }

  async checkin(checkinDto: CheckinLaptopDto, userId: string) {
    // Find laptop by unique ID
    const laptop = await this.prisma.laptop.findFirst({
      where: {
        uniqueId: checkinDto.laptopUniqueId,
        deletedAt: null,
      },
    });

    if (!laptop) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND_LAPTOP,
        message: 'Laptop not found',
      });
    }

    // Check if laptop is checked out
    if (laptop.status !== 'checked_out') {
      throw new BadRequestException({
        code: ErrorCode.VAL_LAPTOP_NOT_CHECKED_OUT,
        message: 'Laptop is not currently checked out',
      });
    }

    // Find active checkout
    const activeCheckout = await this.prisma.checkout.findFirst({
      where: {
        laptopId: laptop.id,
        status: 'active',
      },
      include: {
        user: true,
      },
    });

    if (!activeCheckout) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND_CHECKOUT,
        message: 'No active checkout found for this laptop',
      });
    }

    // Verify the user checking in is the one who checked out
    if (activeCheckout.userId !== userId) {
      throw new BadRequestException({
        code: ErrorCode.VAL_UNAUTHORIZED_CHECKIN,
        message: 'Only the user who checked out this laptop can check it in',
      });
    }

    // Complete checkout and update laptop status in a transaction
    const checkout = await this.prisma.$transaction(async (tx) => {
      // Update checkout record
      const updatedCheckout = await tx.checkout.update({
        where: { id: activeCheckout.id },
        data: {
          checkedInAt: new Date(),
          status: 'completed',
        },
        include: {
          laptop: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
        },
      });

      // Update laptop status back to available
      await tx.laptop.update({
        where: { id: laptop.id },
        data: { status: 'available' },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'checkin',
          entityType: 'laptop',
          entityId: laptop.id,
          details: {
            laptopUniqueId: laptop.uniqueId,
            checkoutId: activeCheckout.id,
            checkoutDuration: Math.floor(
              (new Date().getTime() - activeCheckout.checkedOutAt.getTime()) /
                (1000 * 60),
            ), // duration in minutes
          },
        },
      });

      return updatedCheckout;
    });

    return checkout;
  }

  async reportLost(reportLostDto: ReportLostDto, userId: string) {
    // Find laptop by unique ID
    const laptop = await this.prisma.laptop.findFirst({
      where: {
        uniqueId: reportLostDto.laptopUniqueId,
        deletedAt: null,
      },
    });

    if (!laptop) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND_LAPTOP,
        message: 'Laptop not found',
      });
    }

    // Find active checkout
    const activeCheckout = await this.prisma.checkout.findFirst({
      where: {
        laptopId: laptop.id,
        status: 'active',
      },
    });

    if (!activeCheckout) {
      throw new BadRequestException({
        code: ErrorCode.VAL_LAPTOP_NOT_CHECKED_OUT,
        message: 'Laptop is not currently checked out',
      });
    }

    // Verify the user reporting is the one who checked out
    if (activeCheckout.userId !== userId) {
      throw new BadRequestException({
        code: ErrorCode.VAL_UNAUTHORIZED_ACTION,
        message: 'Only the user who checked out this laptop can report it lost',
      });
    }

    // Update laptop status and create audit log
    const notification = await this.prisma.$transaction(async (tx) => {
      // Update laptop status to maintenance (lost laptops need review)
      await tx.laptop.update({
        where: { id: laptop.id },
        data: { status: 'maintenance' },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'report_lost',
          entityType: 'laptop',
          entityId: laptop.id,
          details: {
            laptopUniqueId: laptop.uniqueId,
            checkoutId: activeCheckout.id,
          },
        },
      });

      // Create notification for admin
      const notificationLog = await tx.notificationLog.create({
        data: {
          notificationType: 'lost_found',
          recipientEmail: 'admin@example.com', // This should come from config
          subject: `Laptop Reported Lost: ${laptop.uniqueId}`,
          body: `Laptop ${laptop.uniqueId} (${laptop.make} ${laptop.model}) has been reported lost by user ${userId}`,
          relatedEntityType: 'laptop',
          relatedEntityId: laptop.id,
          status: 'pending',
        },
      });

      return notificationLog;
    });

    // Queue the notification
    await this.emailQueue.add('send-lost-found-notification', {
      notificationLogId: notification.id,
    });

    return {
      message: 'Laptop reported as lost. Admin has been notified.',
      laptop,
    };
  }

  async reportFound(reportFoundDto: ReportFoundDto) {
    // Find laptop by unique ID
    const laptop = await this.prisma.laptop.findFirst({
      where: {
        uniqueId: reportFoundDto.laptopUniqueId,
        deletedAt: null,
      },
    });

    if (!laptop) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND_LAPTOP,
        message: 'Laptop not found',
      });
    }

    // Find active checkout
    const activeCheckout = await this.prisma.checkout.findFirst({
      where: {
        laptopId: laptop.id,
        status: 'active',
      },
      include: {
        user: true,
      },
    });

    if (!activeCheckout) {
      throw new BadRequestException({
        code: ErrorCode.NOT_FOUND_CHECKOUT,
        message: 'No active checkout found for this laptop',
      });
    }

    // Verify finder exists
    const finder = await this.prisma.user.findFirst({
      where: {
        id: reportFoundDto.finderUserId,
        deletedAt: null,
      },
    });

    if (!finder) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND_USER,
        message: 'Finder user not found',
      });
    }

    // Calculate duration laptop was lost (in minutes)
    const durationMinutes = Math.floor(
      (new Date().getTime() - activeCheckout.checkedOutAt.getTime()) /
        (1000 * 60),
    );

    // Create lost/found event and update records
    const result = await this.prisma.$transaction(async (tx) => {
      // Create lost/found event
      const lostFoundEvent = await tx.lostFoundEvent.create({
        data: {
          laptopId: laptop.id,
          checkoutId: activeCheckout.id,
          originalUserId: activeCheckout.userId,
          finderUserId: finder.id,
          durationMinutes,
        },
        include: {
          laptop: true,
          originalUser: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          finderUser: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      // Complete the checkout
      await tx.checkout.update({
        where: { id: activeCheckout.id },
        data: {
          checkedInAt: new Date(),
          status: 'completed',
        },
      });

      // Update laptop status back to available
      await tx.laptop.update({
        where: { id: laptop.id },
        data: { status: 'available' },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: finder.id,
          action: 'report_found',
          entityType: 'laptop',
          entityId: laptop.id,
          details: {
            laptopUniqueId: laptop.uniqueId,
            originalUserId: activeCheckout.userId,
            finderUserId: finder.id,
            durationMinutes,
          },
        },
      });

      // Create notification for original user
      const notificationForUser = await tx.notificationLog.create({
        data: {
          notificationType: 'lost_found',
          recipientEmail: activeCheckout.user.email,
          recipientUserId: activeCheckout.userId,
          subject: `Your Lost Laptop Has Been Found`,
          body: `The laptop ${laptop.uniqueId} you checked out has been found and returned by ${finder.name}.`,
          relatedEntityType: 'laptop',
          relatedEntityId: laptop.id,
          status: 'pending',
        },
      });

      // Create notification for finder (thank you message)
      const notificationForFinder = await tx.notificationLog.create({
        data: {
          notificationType: 'lost_found',
          recipientEmail: finder.email,
          recipientUserId: finder.id,
          subject: `Thank You for Returning Laptop`,
          body: `Thank you for returning laptop ${laptop.uniqueId}. The original user has been notified.`,
          relatedEntityType: 'laptop',
          relatedEntityId: laptop.id,
          status: 'pending',
        },
      });

      return { lostFoundEvent, notificationForUser, notificationForFinder };
    });

    // Queue both notifications
    await this.emailQueue.add('send-lost-found-notification', {
      notificationLogId: result.notificationForUser.id,
    });

    await this.emailQueue.add('send-lost-found-notification', {
      notificationLogId: result.notificationForFinder.id,
    });

    return result.lostFoundEvent;
  }

  async getActiveCheckouts(userId?: string) {
    const whereClause: any = { status: 'active' };

    if (userId) {
      whereClause.userId = userId;
    }

    const checkouts = await this.prisma.checkout.findMany({
      where: whereClause,
      include: {
        laptop: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { checkedOutAt: 'desc' },
    });

    return checkouts;
  }

  async getCheckoutHistory(userId?: string, laptopId?: string) {
    const whereClause: any = {};

    if (userId) {
      whereClause.userId = userId;
    }

    if (laptopId) {
      whereClause.laptopId = laptopId;
    }

    const checkouts = await this.prisma.checkout.findMany({
      where: whereClause,
      include: {
        laptop: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { checkedOutAt: 'desc' },
    });

    return checkouts;
  }

  async getOverdueCheckouts(thresholdMinutes: number = 1440) {
    // Default threshold: 24 hours (1440 minutes)
    const thresholdDate = new Date(
      Date.now() - thresholdMinutes * 60 * 1000,
    );

    const overdueCheckouts = await this.prisma.checkout.findMany({
      where: {
        status: 'active',
        checkedOutAt: {
          lt: thresholdDate,
        },
      },
      include: {
        laptop: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { checkedOutAt: 'asc' },
    });

    return overdueCheckouts;
  }

  async getLostFoundEvents() {
    const events = await this.prisma.lostFoundEvent.findMany({
      include: {
        laptop: true,
        originalUser: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        finderUser: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { eventTimestamp: 'desc' },
    });

    return events;
  }
}
