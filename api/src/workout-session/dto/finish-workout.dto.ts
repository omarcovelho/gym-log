// src/workout-session/dto/finish-workout.dto.ts
import { IsInt, IsOptional, IsString, IsEnum, Min, Max } from 'class-validator'
import { Feeling } from '@prisma/client' // ou defina manualmente se não for importável

export class FinishWorkoutDto {
  @IsOptional()
  @IsEnum(Feeling)
  feeling?: Feeling

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  fatigue?: number

  @IsOptional()
  @IsString()
  notes?: string
}
