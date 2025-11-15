import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class StartWorkoutDto {
  @IsString()
  @IsNotEmpty()
  templateId: string
}
