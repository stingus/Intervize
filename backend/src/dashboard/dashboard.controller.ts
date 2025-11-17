import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getSummary() {
    const summary = await this.dashboardService.getSummary();
    return {
      success: true,
      data: summary,
      message: 'Dashboard summary retrieved successfully',
    };
  }

  @Get('active-checkouts')
  async getActiveCheckouts() {
    const checkouts = await this.dashboardService.getActiveCheckouts();
    return {
      success: true,
      data: checkouts,
      message: 'Active checkouts retrieved successfully',
    };
  }

  @Get('overdue')
  async getOverdueCheckouts() {
    const checkouts = await this.dashboardService.getOverdueCheckouts();
    return {
      success: true,
      data: checkouts,
      message: 'Overdue checkouts retrieved successfully',
    };
  }

  @Get('lost-found')
  async getLostFoundEvents() {
    const events = await this.dashboardService.getLostFoundEvents();
    return {
      success: true,
      data: events,
      message: 'Lost/found events retrieved successfully',
    };
  }
}
