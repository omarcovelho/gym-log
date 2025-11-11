import { Module } from '@nestjs/common';
import { WorkoutTemplateService } from './workout-template.service';
import { WorkoutTemplateController } from './workout-template.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [WorkoutTemplateController],
  providers: [WorkoutTemplateService, PrismaService],
  exports: [WorkoutTemplateService],
})
export class WorkoutTemplateModule {}
