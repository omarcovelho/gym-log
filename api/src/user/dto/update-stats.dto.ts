import { IsOptional, IsNumber, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateStatsDto {
  @ApiPropertyOptional({ description: 'User name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'User height in cm', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  height?: number;

  @ApiPropertyOptional({ description: 'User weight in kg', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;
}

