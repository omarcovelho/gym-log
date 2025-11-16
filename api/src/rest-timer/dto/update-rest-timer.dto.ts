import { PartialType } from '@nestjs/swagger';
import { CreateRestTimerDto } from './create-rest-timer.dto';

export class UpdateRestTimerDto extends PartialType(CreateRestTimerDto) {}

