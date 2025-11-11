import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator'
import { MuscleGroup } from '../../../generated/prisma'

export class CreateExerciseDto {
  @ApiProperty({ example: 'Supino Reto', description: 'Exercise name' })
  @IsString()
  name: string

  @ApiPropertyOptional({ enum: MuscleGroup, description: 'Muscle group targeted' })
  @IsOptional()
  @IsEnum(MuscleGroup)
  muscleGroup?: MuscleGroup

  @ApiPropertyOptional({ example: 'Perform with controlled tempo' })
  @IsOptional()
  @IsString()
  notes?: string

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isGlobal?: boolean
}
