import { Module } from '@nestjs/common';
import { SleepController } from './sleep.controller';
import { SleepService } from './sleep.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SleepController],
  providers: [SleepService],
  exports: [SleepService],
})
export class SleepModule {}

