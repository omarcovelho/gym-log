import { IsInt, IsOptional, IsString } from 'class-validator'

export class AddExerciseDto {
  @IsString()
  exerciseId: string

  @IsOptional()
  @IsString()
  notes?: string

  @IsOptional()
  @IsInt()
  order?: number
}
