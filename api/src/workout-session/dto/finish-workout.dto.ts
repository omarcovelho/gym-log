// src/workout-session/dto/finish-workout.dto.ts
import { IsInt, IsOptional, IsString, IsEnum, Min, Max, IsISO8601 } from 'class-validator'
import { Feeling } from '../../../generated/prisma'

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

  @IsOptional()
  @IsISO8601()
  endAt?: string
}
