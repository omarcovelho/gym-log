import { Module } from '@nestjs/common';
import { WorkoutSessionService } from './workout-session.service';
import { WorkoutSessionController } from './workout-session.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [WorkoutSessionController],
  providers: [WorkoutSessionService, PrismaService],
  exports: [WorkoutSessionService],
})
export class WorkoutSessionModule {}
