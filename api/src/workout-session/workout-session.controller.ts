import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common'
import { WorkoutSessionService } from './workout-session.service'
import { AddExerciseDto } from './dto/add-exercise.dto'
import { AddSetDto } from './dto/add-set.dto'
import { UpdateSetDto } from './dto/update-set.dto'
import { CurrentUser } from 'src/common/decorators/current-user'
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard'
import { FinishWorkoutDto } from './dto/finish-workout.dto'

@Controller('workouts')
@UseGuards(JwtAuthGuard)
export class WorkoutSessionController {
    constructor(private readonly service: WorkoutSessionService) { }

    @Post('free/start')
    async startFree(@CurrentUser() user) {
        return this.service.startFreeWorkout(user.id)
    }

    @Post('start/:templateId')
    async start(@CurrentUser() user, @Param('templateId') templateId: string) {
        return this.service.startFromTemplate(user.id, templateId)
    }

    @Post(':sessionId/exercises')
    async addExercise(
        @CurrentUser() user,
        @Param('sessionId') sessionId: string,
        @Body() dto: AddExerciseDto,
    ) {
        return this.service.addExercise(user.id, sessionId, dto)
    }

    @Post('exercises/:exerciseId/sets')
    async addSet(@Param('exerciseId') exerciseId: string, @Body() dto: AddSetDto) {
        return this.service.addSet(exerciseId, dto)
    }

    @Patch('sets/:setId')
    async updateSet(@Param('setId') setId: string, @Body() dto: UpdateSetDto) {
        return this.service.updateSet(setId, dto)
    }

    @Post(':sessionId/finish')
    async finish(
        @Param('sessionId') sessionId: string,
        @Body() dto: FinishWorkoutDto,
    ) {
        return this.service.finishSession(sessionId, dto)
    }

    @Get()
    async getAll(@CurrentUser() user) {
        return this.service.findAllForUser(user.id)
    }

    @Get(':id')
    async getById(@CurrentUser() user, @Param('id') id: string) {
        return this.service.findById(user.id, id)
    }

    @Delete(':sessionId')
    async delete(
        @CurrentUser() user,
        @Param('sessionId') sessionId: string,
    ) {
        return this.service.deleteSession(user.id, sessionId)
    }
}
