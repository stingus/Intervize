import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LaptopsService } from './laptops.service';
import { LaptopsController } from './laptops.controller';
import { PrismaService } from '../config/prisma.service';

@Module({
  imports: [ConfigModule],
  controllers: [LaptopsController],
  providers: [LaptopsService, PrismaService],
  exports: [LaptopsService],
})
export class LaptopsModule {}
