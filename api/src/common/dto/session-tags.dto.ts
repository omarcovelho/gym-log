import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { MAX_TAG_NAME_LENGTH } from 'src/workout-tag/workout-tag.util';

export class SessionTagsDto {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(MAX_TAG_NAME_LENGTH, { each: true })
  newTagNames?: string[];
}
