import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  Param,
} from '@nestjs/common';
import { CheckoutsService } from './checkouts.service';
import { CheckoutLaptopDto } from './dto/checkout-laptop.dto';
import { CheckinLaptopDto } from './dto/checkin-laptop.dto';
import { ReportLostDto } from './dto/report-lost.dto';
import { ReportFoundDto } from './dto/report-found.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('checkouts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CheckoutsController {
  constructor(private readonly checkoutsService: CheckoutsService) {}

  @Post('checkout')
  @HttpCode(HttpStatus.CREATED)
  async checkout(@Body() checkoutDto: CheckoutLaptopDto) {
    const checkout = await this.checkoutsService.checkout(checkoutDto);
    return {
      success: true,
      data: checkout,
      message: 'Laptop checked out successfully',
    };
  }

  @Post('checkin')
  @HttpCode(HttpStatus.OK)
  async checkin(
    @Body() checkinDto: CheckinLaptopDto,
    @CurrentUser() user: any,
  ) {
    const checkout = await this.checkoutsService.checkin(checkinDto, user.sub);
    return {
      success: true,
      data: checkout,
      message: 'Laptop checked in successfully',
    };
  }

  @Post('report-lost')
  @HttpCode(HttpStatus.OK)
  async reportLost(
    @Body() reportLostDto: ReportLostDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.checkoutsService.reportLost(
      reportLostDto,
      user.sub,
    );
    return {
      success: true,
      data: result,
      message: result.message,
    };
  }

  @Post('report-found')
  @HttpCode(HttpStatus.OK)
  async reportFound(@Body() reportFoundDto: ReportFoundDto) {
    const result = await this.checkoutsService.reportFound(reportFoundDto);
    return {
      success: true,
      data: result,
      message: 'Laptop marked as found and returned successfully',
    };
  }

  @Get('active')
  async getActiveCheckouts(@Query('userId') userId?: string) {
    const checkouts = await this.checkoutsService.getActiveCheckouts(userId);
    return {
      success: true,
      data: checkouts,
      message: 'Active checkouts retrieved successfully',
    };
  }

  @Get('history')
  async getCheckoutHistory(
    @Query('userId') userId?: string,
    @Query('laptopId') laptopId?: string,
  ) {
    const checkouts = await this.checkoutsService.getCheckoutHistory(
      userId,
      laptopId,
    );
    return {
      success: true,
      data: checkouts,
      message: 'Checkout history retrieved successfully',
    };
  }

  @Get('overdue')
  @Roles('admin')
  async getOverdueCheckouts(@Query('threshold') threshold?: string) {
    const thresholdMinutes = threshold ? parseInt(threshold, 10) : undefined;
    const checkouts =
      await this.checkoutsService.getOverdueCheckouts(thresholdMinutes);
    return {
      success: true,
      data: checkouts,
      message: 'Overdue checkouts retrieved successfully',
    };
  }

  @Get('lost-found-events')
  @Roles('admin')
  async getLostFoundEvents() {
    const events = await this.checkoutsService.getLostFoundEvents();
    return {
      success: true,
      data: events,
      message: 'Lost/found events retrieved successfully',
    };
  }

  @Get('status/:laptopUniqueId')
  async getCheckoutStatus(
    @Param('laptopUniqueId') laptopUniqueId: string,
    @CurrentUser() user: any,
  ) {
    const status = await this.checkoutsService.getCheckoutStatus(
      laptopUniqueId,
      user.sub,
    );
    return {
      success: true,
      data: status,
      message: 'Checkout status retrieved successfully',
    };
  }

  @Get('my-current')
  async getMyCurrentCheckout(@CurrentUser() user: any) {
    const checkout = await this.checkoutsService.getCurrentUserCheckout(
      user.sub,
    );
    return {
      success: true,
      data: checkout,
      message: checkout
        ? 'Current checkout retrieved successfully'
        : 'No active checkout found',
    };
  }
}
