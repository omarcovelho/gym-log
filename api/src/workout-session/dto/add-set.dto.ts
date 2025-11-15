import { IsInt, IsOptional, IsString, Min } from 'class-validator'

export class AddSetDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  setIndex?: number

  @IsOptional()
  @IsInt()
  plannedReps?: number

  @IsOptional()
  @IsInt()
  plannedRir?: number

  @IsOptional()
  @IsString()
  notes?: string
}
