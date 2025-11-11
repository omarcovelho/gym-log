import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { ExerciseService } from './exercise.service'
import { CreateExerciseDto } from './dto/create-exercise.dto'
import { UpdateExerciseDto } from './dto/update-exercise.dto'
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard'
import { CurrentUser } from 'src/common/decorators/current-user'

@ApiTags('Exercises')
@ApiBearerAuth()
@Controller('exercises')
@UseGuards(JwtAuthGuard)
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new exercise' })
  @ApiResponse({ status: 201, description: 'Exercise created successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  create(@Body() dto: CreateExerciseDto, @CurrentUser() user) {
    return this.exerciseService.create(dto, user.id)
  }

  @Get()
  @ApiOperation({ summary: 'Get all exercises' })
  @ApiResponse({ status: 200, description: 'List of all exercises.' })
  findAll() {
    return this.exerciseService.findAll()
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an exercise by ID' })
  @ApiResponse({ status: 200, description: 'Exercise found.' })
  @ApiResponse({ status: 404, description: 'Exercise not found.' })
  findOne(@Param('id') id: string) {
    return this.exerciseService.findOne(id)
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing exercise' })
  @ApiResponse({ status: 200, description: 'Exercise updated successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  update(@Param('id') id: string, @Body() dto: UpdateExerciseDto) {
    return this.exerciseService.update(id, dto)
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an exercise' })
  @ApiResponse({ status: 204, description: 'Exercise deleted successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  remove(@Param('id') id: string) {
    return this.exerciseService.remove(id)
  }
}
