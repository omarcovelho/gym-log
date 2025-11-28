import { IsNotEmpty, IsString } from 'class-validator'

export class StartFreeWorkoutDto {
  @IsString()
  @IsNotEmpty()
  title: string
}

