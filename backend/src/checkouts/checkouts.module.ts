import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { CheckoutsService } from './checkouts.service';
import { CheckoutsController } from './checkouts.controller';
import { PrismaService } from '../config/prisma.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email',
    }),
  ],
  controllers: [CheckoutsController],
  providers: [CheckoutsService, PrismaService],
  exports: [CheckoutsService],
})
export class CheckoutsModule {}
