import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { MAX_TAG_NAME_LENGTH } from '../workout-tag.util';

export class UpdateWorkoutTagDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_TAG_NAME_LENGTH)
  name: string;
}
