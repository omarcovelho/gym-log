import { Module } from '@nestjs/common';
import { WorkoutTagService } from './workout-tag.service';
import { WorkoutTagController } from './workout-tag.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [WorkoutTagController],
  providers: [WorkoutTagService, PrismaService],
  exports: [WorkoutTagService],
})
export class WorkoutTagModule {}
