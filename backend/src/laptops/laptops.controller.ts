import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { LaptopsService } from './laptops.service';
import { CreateLaptopDto } from './dto/create-laptop.dto';
import { UpdateLaptopDto } from './dto/update-laptop.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('laptops')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LaptopsController {
  constructor(private readonly laptopsService: LaptopsService) {}

  @Post()
  @Roles('admin')
  async create(@Body() createLaptopDto: CreateLaptopDto) {
    const laptop = await this.laptopsService.create(createLaptopDto);
    return {
      success: true,
      data: laptop,
      message: 'Laptop created successfully',
    };
  }

  @Get()
  async findAll(@Query('includeRetired') includeRetired?: string) {
    const shouldIncludeRetired = includeRetired === 'true';
    const laptops = await this.laptopsService.findAll(shouldIncludeRetired);
    return {
      success: true,
      data: laptops,
      message: 'Laptops retrieved successfully',
    };
  }

  @Get('unique/:uniqueId')
  async findByUniqueId(@Param('uniqueId') uniqueId: string) {
    const laptop = await this.laptopsService.findByUniqueId(uniqueId);
    return {
      success: true,
      data: laptop,
      message: 'Laptop retrieved successfully',
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const laptop = await this.laptopsService.findOne(id);
    return {
      success: true,
      data: laptop,
      message: 'Laptop retrieved successfully',
    };
  }

  @Get(':id/history')
  @Roles('admin')
  async getHistory(@Param('id') id: string) {
    const history = await this.laptopsService.getHistory(id);
    return {
      success: true,
      data: history,
      message: 'Laptop history retrieved successfully',
    };
  }

  @Get(':id/qr-code')
  @Roles('admin')
  async getQRCode(@Param('id') id: string) {
    const qrCode = await this.laptopsService.generateQRCodeImage(id);
    return {
      success: true,
      data: { qrCode },
      message: 'QR code generated successfully',
    };
  }

  @Patch(':id')
  @Roles('admin')
  async update(@Param('id') id: string, @Body() updateLaptopDto: UpdateLaptopDto) {
    const laptop = await this.laptopsService.update(id, updateLaptopDto);
    return {
      success: true,
      data: laptop,
      message: 'Laptop updated successfully',
    };
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    const result = await this.laptopsService.remove(id);
    return {
      success: true,
      message: result.message,
    };
  }
}
