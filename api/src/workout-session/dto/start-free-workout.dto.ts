import { IsNotEmpty, IsString } from 'class-validator';
import { SessionTagsDto } from 'src/common/dto/session-tags.dto';

export class StartFreeWorkoutDto extends SessionTagsDto {
  @IsString()
  @IsNotEmpty()
  title: string;
}
