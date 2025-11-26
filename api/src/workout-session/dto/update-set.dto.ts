import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
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
}

export class UpdateSetDto {
  @IsOptional()
  @IsNumber()
  actualLoad?: number

  @IsOptional()
  @IsInt()
  actualReps?: number

  @IsOptional()
  @IsInt()
  actualRir?: number

  @IsOptional()
  @IsBoolean()
  completed?: boolean

  @IsOptional()
  @IsString()
  notes?: string

  @IsOptional()
  @IsEnum(SetIntensityType)
  intensityType?: SetIntensityType

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSetIntensityBlockDto)
  intensityBlocks?: UpdateSetIntensityBlockDto[]
}
