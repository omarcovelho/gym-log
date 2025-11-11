import { Type } from 'class-transformer'
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateNested } from 'class-validator'

export class CreateTemplateSetDto {
  @IsInt() @Min(0)
  setIndex: number

  @IsOptional() @IsInt() @Min(0)
  reps?: number

  @IsOptional() @IsInt() @Min(0)
  rir?: number

  @IsOptional() @IsString()
  notes?: string
}

export class CreateTemplateExerciseDto {
  @IsString() @IsNotEmpty()
  exerciseId: string

  @IsInt() @Min(0)
  order: number

  @IsOptional() @IsString()
  notes?: string

  @IsArray() @ValidateNested({ each: true }) @Type(() => CreateTemplateSetDto)
  sets: CreateTemplateSetDto[]
}

export class CreateWorkoutTemplateDto {
  @IsString() @IsNotEmpty()
  title: string

  @IsOptional() @IsString()
  notes?: string

  @IsArray() @ValidateNested({ each: true }) @Type(() => CreateTemplateExerciseDto)
  items: CreateTemplateExerciseDto[]
}
