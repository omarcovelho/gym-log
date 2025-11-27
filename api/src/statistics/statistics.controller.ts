import { Controller, Get, Post, Delete, UseGuards, Query, Param, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user';

@ApiTags('Statistics')
@ApiBearerAuth()
@Controller('statistics')
@UseGuards(JwtAuthGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('workouts')
  @ApiOperation({ summary: 'Get workout statistics for dashboard' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getStats(@CurrentUser() user) {
    return this.statisticsService.getUserStats(user.id);
  }

  @Get('evolution')
  @ApiOperation({ summary: 'Get evolution statistics (PRs and weekly volume)' })
  @ApiQuery({ name: 'weeks', required: false, type: Number, description: 'Number of weeks to analyze (deprecated, use startDate/endDate)' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (ISO string)' })
  @ApiResponse({ status: 200, description: 'Evolution statistics retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 400, description: 'Bad request (invalid date range).' })
  async getEvolution(
    @CurrentUser() user,
    @Query('weeks') weeks?: string,
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
  ) {
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (startDateStr && endDateStr) {
      startDate = new Date(startDateStr);
      endDate = new Date(endDateStr);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new BadRequestException('Invalid date format. Use ISO date strings.');
      }

      if (startDate > endDate) {
        throw new BadRequestException('startDate must be less than or equal to endDate.');
      }
    }

    const weeksNumber = weeks ? parseInt(weeks, 10) : undefined;
    return this.statisticsService.getEvolutionStats(user.id, startDate, endDate, weeksNumber);
  }

  @Get('exercise/:exerciseId/progression')
  @ApiOperation({ summary: 'Get exercise progression statistics' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (ISO string)' })
  @ApiResponse({ status: 200, description: 'Exercise progression retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 400, description: 'Bad request (invalid date range or exercise not found).' })
  async getExerciseProgression(
    @CurrentUser() user,
    @Param('exerciseId') exerciseId: string,
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
  ) {
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (startDateStr && endDateStr) {
      startDate = new Date(startDateStr);
      endDate = new Date(endDateStr);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new BadRequestException('Invalid date format. Use ISO date strings.');
      }

      if (startDate > endDate) {
        throw new BadRequestException('startDate must be less than or equal to endDate.');
      }
    }

    return this.statisticsService.getExerciseProgression(user.id, exerciseId, startDate, endDate);
  }

  @Get('pinned-exercises')
  @ApiOperation({ summary: 'Get pinned exercises for the current user' })
  @ApiResponse({ status: 200, description: 'Pinned exercises retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getPinnedExercises(@CurrentUser() user) {
    return this.statisticsService.getPinnedExercises(user.id);
  }

  @Post('pinned-exercises/:exerciseId')
  @ApiOperation({ summary: 'Pin an exercise for the current user' })
  @ApiResponse({ status: 200, description: 'Exercise pinned successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 400, description: 'Bad request (exercise not found, already pinned, or limit reached).' })
  async pinExercise(@CurrentUser() user, @Param('exerciseId') exerciseId: string) {
    await this.statisticsService.pinExercise(user.id, exerciseId);
    return { message: 'Exercise pinned successfully' };
  }

  @Delete('pinned-exercises/:exerciseId')
  @ApiOperation({ summary: 'Unpin an exercise for the current user' })
  @ApiResponse({ status: 200, description: 'Exercise unpinned successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 400, description: 'Bad request (exercise not found or not pinned).' })
  async unpinExercise(@CurrentUser() user, @Param('exerciseId') exerciseId: string) {
    await this.statisticsService.unpinExercise(user.id, exerciseId);
    return { message: 'Exercise unpinned successfully' };
  }

  @Get('exercise/:exerciseId/history')
  @ApiOperation({ summary: 'Get exercise history (previous sessions with sets)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of sessions to return (default: 5)' })
  @ApiResponse({ status: 200, description: 'Exercise history retrieved successfully. Returns empty array if no sessions found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 400, description: 'Bad request (invalid limit).' })
  async getExerciseHistory(
    @CurrentUser() user,
    @Param('exerciseId') exerciseId: string,
    @Query('limit') limit?: string,
  ) {
    let limitNumber = 5;
    if (limit) {
      const parsed = parseInt(limit, 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 20) {
        throw new BadRequestException('Limit must be a number between 1 and 20');
      }
      limitNumber = parsed;
    }
    return this.statisticsService.getExerciseHistory(user.id, exerciseId, limitNumber);
  }
}

