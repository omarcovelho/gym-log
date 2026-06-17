import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WorkoutTagService } from './workout-tag.service';
import { CreateWorkoutTagDto } from './dto/create-workout-tag.dto';
import { UpdateWorkoutTagDto } from './dto/update-workout-tag.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { CurrentUser } from 'src/common/decorators/current-user';

@ApiTags('Workout Tags')
@ApiBearerAuth()
@Controller('tags')
@UseGuards(JwtAuthGuard)
export class WorkoutTagController {
  constructor(private readonly service: WorkoutTagService) {}

  @Get()
  @ApiOperation({ summary: 'List workout tags for the current user' })
  async findAll(@CurrentUser() user) {
    return this.service.findAllForUser(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a workout tag' })
  async create(@CurrentUser() user, @Body() dto: CreateWorkoutTagDto) {
    return this.service.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Rename a workout tag' })
  async update(
    @CurrentUser() user,
    @Param('id') id: string,
    @Body() dto: UpdateWorkoutTagDto,
  ) {
    return this.service.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a workout tag' })
  async remove(@CurrentUser() user, @Param('id') id: string) {
    return this.service.remove(user.id, id);
  }
}
