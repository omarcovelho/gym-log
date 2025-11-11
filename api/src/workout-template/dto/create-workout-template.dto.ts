import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsArray, IsInt, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

class CreateTemplateItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  exerciseId!: string

  @ApiProperty({ example: 0, minimum: 0 })
  @IsInt()
  @Min(0)
  order!: number

  @ApiPropertyOptional({ example: '3x10 RIR 2' })
  @IsOptional()
  @IsString()
  target?: string
}

export class CreateWorkoutTemplateDto {
  @ApiProperty({ example: 'Push Day A' })
  @IsString()
  title!: string

  @ApiProperty({ type: [CreateTemplateItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTemplateItemDto)
  items!: CreateTemplateItemDto[]
}
