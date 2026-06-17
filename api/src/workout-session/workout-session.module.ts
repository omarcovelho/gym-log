import { Module } from '@nestjs/common';
import { WorkoutSessionService } from './workout-session.service';
import { WorkoutSessionController } from './workout-session.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { WorkoutTagModule } from 'src/workout-tag/workout-tag.module';

@Module({
  imports: [WorkoutTagModule],
  controllers: [WorkoutSessionController],
  providers: [WorkoutSessionService, PrismaService],
  exports: [WorkoutSessionService],
})
export class WorkoutSessionModule {}
