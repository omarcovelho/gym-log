import { PartialType } from '@nestjs/swagger'
import { CreateWorkoutTemplateDto } from './create-workout-template.dto'

export class UpdateWorkoutTemplateDto extends PartialType(CreateWorkoutTemplateDto) {}
