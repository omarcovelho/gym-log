import { IsString, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRestTimerDto {
  @ApiProperty({ description: 'Timer name (e.g., "1:30", "My Custom Timer")' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Duration in seconds', minimum: 10, maximum: 1800 })
  @IsInt()
  @Min(10)
  @Max(1800) // 30 minutes max
  seconds: number;
}

