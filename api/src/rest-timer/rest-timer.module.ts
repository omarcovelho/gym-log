import { Module } from '@nestjs/common';
import { RestTimerService } from './rest-timer.service';
import { RestTimerController } from './rest-timer.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [RestTimerController],
  providers: [RestTimerService, PrismaService],
  exports: [RestTimerService],
})
export class RestTimerModule {}

