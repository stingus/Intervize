import { Injectable } from '@nestjs/common';
import { PrismaService } from '../config/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary() {
    // Get total laptops (excluding soft deleted)
    const totalLaptops = await this.prisma.laptop.count({
      where: { deletedAt: null },
    });

    // Get available laptops
    const availableLaptops = await this.prisma.laptop.count({
      where: {
        deletedAt: null,
        status: 'available',
      },
    });

    // Get checked out laptops
    const checkedOutLaptops = await this.prisma.laptop.count({
      where: {
        deletedAt: null,
        status: 'checked_out',
      },
    });

    // Get overdue laptops (checked out more than 24 hours ago)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const overdueCheckouts = await this.prisma.checkout.findMany({
      where: {
        checkedInAt: null,
        checkedOutAt: {
          lt: twentyFourHoursAgo,
        },
      },
    });

    const overdueLaptops = overdueCheckouts.length;

    return {
      totalLaptops,
      availableLaptops,
      checkedOutLaptops,
      overdueLaptops,
    };
  }

  async getActiveCheckouts() {
    const checkouts = await this.prisma.checkout.findMany({
      where: {
        checkedInAt: null,
      },
      include: {
        laptop: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        checkedOutAt: 'desc',
      },
    });

    return checkouts;
  }

  async getOverdueCheckouts() {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const checkouts = await this.prisma.checkout.findMany({
      where: {
        checkedInAt: null,
        checkedOutAt: {
          lt: twentyFourHoursAgo,
        },
      },
      include: {
        laptop: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        checkedOutAt: 'asc',
      },
    });

    return checkouts;
  }

  async getLostFoundEvents() {
    // Get lost/found events from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const events = await this.prisma.lostFoundEvent.findMany({
      where: {
        eventTimestamp: {
          gte: thirtyDaysAgo,
        },
      },
      include: {
        laptop: true,
        originalUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        finderUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        eventTimestamp: 'desc',
      },
      take: 10,
    });

    return events;
  }
}
