import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullBoardAuthMiddleware } from './bull-board.middleware';
import { PrismaService } from '../config/prisma.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-secret-key',
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [BullBoardAuthMiddleware, PrismaService],
  exports: [BullBoardAuthMiddleware],
})
export class BullBoardModule {}
