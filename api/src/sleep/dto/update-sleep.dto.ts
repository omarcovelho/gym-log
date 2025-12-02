import { IsNumber, IsOptional, IsString, IsDateString, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSleepDto {
  @ApiPropertyOptional({ description: 'Hours of sleep (e.g. 7.5)', minimum: 0, maximum: 24 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(24)
  sleepHours?: number;

  @ApiPropertyOptional({ description: 'Sleep quality from 1 to 10', minimum: 1, maximum: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  sleepQuality?: number;

  @ApiPropertyOptional({ description: 'Bedtime (ISO string)' })
  @IsOptional()
  @IsDateString()
  sleepBedtime?: string;

  @ApiPropertyOptional({ description: 'Wake time (ISO string)' })
  @IsOptional()
  @IsDateString()
  sleepWakeTime?: string;

  @ApiPropertyOptional({ description: 'Notes about the sleep' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Date of the sleep record (ISO string)' })
  @IsOptional()
  @IsDateString()
  date?: string;
}

