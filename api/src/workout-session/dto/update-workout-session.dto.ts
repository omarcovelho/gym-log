import { IsOptional, IsString } from 'class-validator';
import { SessionTagsDto } from 'src/common/dto/session-tags.dto';

export class UpdateWorkoutSessionDto extends SessionTagsDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
