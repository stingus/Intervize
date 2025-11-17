import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import { randomBytes } from 'crypto';
import { PrismaService } from '../config/prisma.service';
import { CreateLaptopDto } from './dto/create-laptop.dto';
import { UpdateLaptopDto } from './dto/update-laptop.dto';
import { ErrorCode } from '../common/enums/error-codes.enum';

@Injectable()
export class LaptopsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async create(createLaptopDto: CreateLaptopDto) {
    // Generate unique ID for laptop
    const uniqueId = this.generateUniqueId();

    // Generate QR code
    const qrCodeUrl = await this.generateQRCode(uniqueId);

    const laptop = await this.prisma.laptop.create({
      data: {
        uniqueId,
        serialNumber: createLaptopDto.serialNumber,
        make: createLaptopDto.make,
        model: createLaptopDto.model,
        status: createLaptopDto.status || 'available',
        qrCodeUrl,
      },
    });

    return laptop;
  }

  async findAll(includeRetired: boolean = false) {
    const whereClause: any = { deletedAt: null };

    if (!includeRetired) {
      whereClause.status = { not: 'retired' };
    }

    const laptops = await this.prisma.laptop.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return laptops;
  }

  async findOne(id: string) {
    const laptop = await this.prisma.laptop.findFirst({
      where: { id, deletedAt: null },
    });

    if (!laptop) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND_LAPTOP,
        message: 'Laptop not found',
      });
    }

    return laptop;
  }

  async findByUniqueId(uniqueId: string) {
    const laptop = await this.prisma.laptop.findFirst({
      where: { uniqueId, deletedAt: null },
    });

    if (!laptop) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND_LAPTOP,
        message: 'Laptop not found',
      });
    }

    return laptop;
  }

  async update(id: string, updateLaptopDto: UpdateLaptopDto) {
    // Check if laptop exists
    const existingLaptop = await this.prisma.laptop.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existingLaptop) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND_LAPTOP,
        message: 'Laptop not found',
      });
    }

    const laptop = await this.prisma.laptop.update({
      where: { id },
      data: updateLaptopDto,
    });

    return laptop;
  }

  async remove(id: string) {
    // Check if laptop exists
    const existingLaptop = await this.prisma.laptop.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existingLaptop) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND_LAPTOP,
        message: 'Laptop not found',
      });
    }

    // Soft delete the laptop
    await this.prisma.laptop.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Laptop deleted successfully' };
  }

  async getHistory(id: string) {
    // Check if laptop exists
    const laptop = await this.findOne(id);

    const checkouts = await this.prisma.checkout.findMany({
      where: { laptopId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { checkedOutAt: 'desc' },
    });

    return {
      laptop,
      checkouts,
    };
  }

  async generateQRCodeImage(laptopId: string): Promise<string> {
    const laptop = await this.findOne(laptopId);
    return this.generateQRCode(laptop.uniqueId);
  }

  private generateUniqueId(): string {
    // Generate a unique ID using random bytes
    const randomId = randomBytes(8).toString('hex').toUpperCase();
    return `LAP-${randomId}`;
  }

  private async generateQRCode(uniqueId: string): Promise<string> {
    try {
      const appUrl = this.configService.get<string>('APP_URL');
      const scanUrl = `${appUrl}/scan/${uniqueId}`;

      // Generate QR code as Data URL
      const qrCodeDataUrl = await QRCode.toDataURL(scanUrl, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'M',
      });

      return qrCodeDataUrl;
    } catch (error) {
      throw new InternalServerErrorException({
        code: ErrorCode.SRV_QR_GENERATION_FAILED,
        message: 'Failed to generate QR code',
        details: { error: error.message },
      });
    }
  }
}
