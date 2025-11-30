import {
  IsOptional,
  IsString,
  IsInt,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsNumber,
} from 'class-validator'
import { Type } from 'class-transformer'
import { SetIntensityType } from '../../../generated/prisma'

export class UpdateSetIntensityBlockDto {
  @IsOptional()
  @IsString()
  id?: string

  @IsInt()
  blockIndex: number

  @IsOptional()
  @IsInt()
  reps?: number | null

  @IsOptional()
  @IsInt()
  restSeconds?: number | null

  @IsOptional()
  @IsNumber()
  load?: number | null
}

export class UpdateSetDto {
  @IsString()
  id: string

  @IsInt()
  setIndex: number

  @IsOptional()
  @IsInt()
  plannedReps?: number | null

  @IsOptional()
  @IsInt()
  plannedRir?: number | null

  @IsOptional()
  @IsNumber()
  actualLoad?: number | null

  @IsOptional()
  @IsInt()
  actualReps?: number | null

  @IsOptional()
  @IsInt()
  actualRir?: number | null

  @IsOptional()
  @IsBoolean()
  completed?: boolean

  @IsOptional()
  @IsString()
  notes?: string | null

  @IsOptional()
  @IsString()
  intensityType?: SetIntensityType

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSetIntensityBlockDto)
  intensityBlocks?: UpdateSetIntensityBlockDto[]
}

export class UpdateWorkoutExerciseDto {
  @IsOptional()
  @IsInt()
  order?: number

  @IsOptional()
  @IsString()
  notes?: string | null

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSetDto)
  sets?: UpdateSetDto[]
}
