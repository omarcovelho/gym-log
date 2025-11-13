import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { CreateWorkoutTemplateDto } from './dto/create-workout-template.dto'
import { WorkoutTemplateService } from './workout-template.service'
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard'
import { CurrentUser } from 'src/common/decorators/current-user'
import { PaginationDto } from 'src/common/dto/pagination.dto'

@ApiTags('Workout Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workout-templates')
export class WorkoutTemplateController {
  constructor(private service: WorkoutTemplateService) {}

  @Get()
  @ApiOperation({ summary: 'Get all workout templates for the current user' })
  @ApiResponse({ status: 200, description: 'List of workout templates retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async list(@CurrentUser() user: any, @Query() pagination: PaginationDto) {
    return this.service.listByOwner(user.id, pagination)
  }

  @Post()
  @ApiOperation({ summary: 'Create a new workout template' })
  @ApiResponse({ status: 201, description: 'Workout template created successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async create(@CurrentUser() user: any, @Body() dto: CreateWorkoutTemplateDto) {
    return this.service.create(user.id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a workout template' })
  @ApiResponse({ status: 200, description: 'Workout template deleted successfully.' })
  @ApiResponse({ status: 403, description: 'Access denied.' })
  @ApiResponse({ status: 404, description: 'Template not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    await this.service.delete(id, user.id)
    return { ok: true }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a workout template by ID' })
  @ApiResponse({ status: 200, description: 'Workout template retrieved successfully.' })
  @ApiResponse({ status: 403, description: 'Access denied.' })
  @ApiResponse({ status: 404, description: 'Template not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getTemplate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.getById(id, user.id)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a workout template' })
  @ApiResponse({ status: 200, description: 'Workout template updated successfully.' })
  @ApiResponse({ status: 403, description: 'Access denied.' })
  @ApiResponse({ status: 404, description: 'Template not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, user.id, dto)
  }
}
