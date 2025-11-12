import { IsBoolean, IsInt, IsNumber, IsOptional, IsString } from 'class-validator'

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
}
