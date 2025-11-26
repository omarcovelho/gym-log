import { IsNumber, IsOptional, IsString, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBodyMeasurementDto {
  @ApiProperty({ description: 'Weight in kg', minimum: 0 })
  @IsNumber()
  @Min(0)
  weight: number;

  @ApiPropertyOptional({ description: 'Waist measurement in cm', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  waist?: number;

  @ApiPropertyOptional({ description: 'Arm measurement in cm', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  arm?: number;

  @ApiPropertyOptional({ description: 'Notes about the measurement' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Date of the measurement (ISO string). Defaults to today.' })
  @IsOptional()
  @IsDateString()
  date?: string;
}

