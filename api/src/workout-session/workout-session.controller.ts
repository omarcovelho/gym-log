import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { WorkoutSessionService } from './workout-session.service'
import { AddExerciseDto } from './dto/add-exercise.dto'
import { AddSetDto } from './dto/add-set.dto'
import { UpdateSetDto } from './dto/update-set.dto'
import { CurrentUser } from 'src/common/decorators/current-user'
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard'
import { FinishWorkoutDto } from './dto/finish-workout.dto'
import { UpdateWorkoutExerciseDto } from './dto/update-session.dto'
import { PaginationDto } from 'src/common/dto/pagination.dto'

@ApiTags('Workout Sessions')
@ApiBearerAuth()
@Controller('workouts')
@UseGuards(JwtAuthGuard)
export class WorkoutSessionController {
    constructor(private readonly service: WorkoutSessionService) { }

    @Post('free/start')
    @ApiOperation({ summary: 'Start a free workout session' })
    @ApiResponse({ status: 201, description: 'Free workout session created successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async startFree(@CurrentUser() user) {
        return this.service.startFreeWorkout(user.id)
    }

    @Post('start/:templateId')
    @ApiOperation({ summary: 'Start a workout session from a template' })
    @ApiResponse({ status: 201, description: 'Workout session created from template successfully.' })
    @ApiResponse({ status: 404, description: 'Template not found.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async start(@CurrentUser() user, @Param('templateId') templateId: string) {
        return this.service.startFromTemplate(user.id, templateId)
    }

    @Post(':sessionId/exercises')
    @ApiOperation({ summary: 'Add an exercise to a workout session' })
    @ApiResponse({ status: 201, description: 'Exercise added to session successfully.' })
    @ApiResponse({ status: 403, description: 'Access denied.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async addExercise(
        @CurrentUser() user,
        @Param('sessionId') sessionId: string,
        @Body() dto: AddExerciseDto,
    ) {
        return this.service.addExercise(user.id, sessionId, dto)
    }

    @Post('exercises/:exerciseId/sets')
    @ApiOperation({ summary: 'Add a set to an exercise in a workout session' })
    @ApiResponse({ status: 201, description: 'Set added successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async addSet(@Param('exerciseId') exerciseId: string, @Body() dto: AddSetDto) {
        return this.service.addSet(exerciseId, dto)
    }

    @Patch('sets/:setId')
    @ApiOperation({ summary: 'Update a set in a workout session' })
    @ApiResponse({ status: 200, description: 'Set updated successfully.' })
    @ApiResponse({ status: 403, description: 'Access denied.' })
    @ApiResponse({ status: 404, description: 'Set not found.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async updateSet(
        @CurrentUser() user,
        @Param('setId') setId: string,
        @Body() dto: UpdateSetDto,
    ) {
        return this.service.updateSet(setId, user.id, dto)
    }

    @Post(':sessionId/finish')
    @ApiOperation({ summary: 'Finish a workout session' })
    @ApiResponse({ status: 200, description: 'Workout session finished successfully.' })
    @ApiResponse({ status: 404, description: 'Session not found.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async finish(
        @Param('sessionId') sessionId: string,
        @Body() dto: FinishWorkoutDto,
    ) {
        return this.service.finishSession(sessionId, dto)
    }

    @Get()
    @ApiOperation({ summary: 'Get all workout sessions for the current user' })
    @ApiResponse({ status: 200, description: 'List of workout sessions retrieved successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async getAll(@CurrentUser() user, @Query() pagination: PaginationDto) {
        return this.service.findAllForUser(user.id, pagination)
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a workout session by ID' })
    @ApiResponse({ status: 200, description: 'Workout session retrieved successfully.' })
    @ApiResponse({ status: 403, description: 'Access denied.' })
    @ApiResponse({ status: 404, description: 'Session not found.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async getById(@CurrentUser() user, @Param('id') id: string) {
        return this.service.findById(user.id, id)
    }

    @Delete(':sessionId')
    @ApiOperation({ summary: 'Delete a workout session' })
    @ApiResponse({ status: 200, description: 'Workout session deleted successfully.' })
    @ApiResponse({ status: 403, description: 'Access denied.' })
    @ApiResponse({ status: 404, description: 'Session not found.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async delete(
        @CurrentUser() user,
        @Param('sessionId') sessionId: string,
    ) {
        return this.service.deleteSession(user.id, sessionId)
    }

    @Patch('exercises/:id')
    @ApiOperation({ summary: 'Update an exercise in a workout session' })
    @ApiResponse({ status: 200, description: 'Exercise updated successfully.' })
    @ApiResponse({ status: 403, description: 'Access denied.' })
    @ApiResponse({ status: 404, description: 'Exercise not found.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async updateExercise(
        @CurrentUser() user,
        @Param('id') id: string,
        @Body() dto: UpdateWorkoutExerciseDto,
    ) {
        return this.service.updateExercise(id, user.id, dto)
    }

    @Delete('exercises/:id')
    @ApiOperation({ summary: 'Delete an exercise from a workout session' })
    @ApiResponse({ status: 200, description: 'Exercise deleted successfully.' })
    @ApiResponse({ status: 403, description: 'Access denied.' })
    @ApiResponse({ status: 404, description: 'Exercise not found.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async deleteExercise(
        @CurrentUser() user,
        @Param('id') id: string,
    ) {
        return this.service.deleteExercise(id, user.id)
    }

    @Delete('sets/:id')
    @ApiOperation({ summary: 'Delete a set from a workout session' })
    @ApiResponse({ status: 200, description: 'Set deleted successfully.' })
    @ApiResponse({ status: 403, description: 'Access denied.' })
    @ApiResponse({ status: 404, description: 'Set not found.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async deleteSet(
        @CurrentUser() user,
        @Param('id') id: string,
    ) {
        return this.service.deleteSet(id, user.id)
    }
}
