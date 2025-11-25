import { IsOptional, IsString } from 'class-validator'

export class UpdateWorkoutSessionDto {
  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsString()
  notes?: string | null
}

