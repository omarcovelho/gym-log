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
  Put,
  Query,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { ExerciseService } from './exercise.service'
import { CreateExerciseDto } from './dto/create-exercise.dto'
import { UpdateExerciseDto } from './dto/update-exercise.dto'
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard'
import { CurrentUser } from 'src/common/decorators/current-user'
import { PaginationDto } from 'src/common/dto/pagination.dto'
import { Roles } from 'src/common/decorators/roles.decorator'
import { RolesGuard } from 'src/common/guards/roles.guard'

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
  findAll(@Query() pagination: PaginationDto) {
    return this.exerciseService.findAll(pagination)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an exercise by ID' })
  @ApiResponse({ status: 200, description: 'Exercise found.' })
  @ApiResponse({ status: 404, description: 'Exercise not found.' })
  findOne(@Param('id') id: string) {
    return this.exerciseService.findOne(id)
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiOperation({ summary: 'Update an existing exercise' })
  @ApiResponse({ status: 200, description: 'Exercise updated successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  update(@Param('id') id: string, @Body() dto: UpdateExerciseDto) {
    return this.exerciseService.update(id, dto)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete an exercise' })
  @ApiResponse({ status: 200, description: 'Exercise deleted successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required for global exercises or must be creator.' })
  remove(@Param('id') id: string, @CurrentUser() user) {
    return this.exerciseService.remove(id, user.id, user.role)
  }
}
