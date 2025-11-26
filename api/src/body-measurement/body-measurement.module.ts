import { Module } from '@nestjs/common';
import { BodyMeasurementService } from './body-measurement.service';
import { BodyMeasurementController } from './body-measurement.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BodyMeasurementController],
  providers: [BodyMeasurementService],
  exports: [BodyMeasurementService],
})
export class BodyMeasurementModule {}

