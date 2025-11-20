import { Controller, Get, UseGuards, Query } from '@nestjs/common';
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
  @ApiQuery({ name: 'weeks', required: false, type: Number, description: 'Number of weeks to analyze (default: 4)' })
  @ApiResponse({ status: 200, description: 'Evolution statistics retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getEvolution(
    @CurrentUser() user,
    @Query('weeks') weeks?: string,
  ) {
    const weeksNumber = weeks ? parseInt(weeks, 10) : 4;
    return this.statisticsService.getEvolutionStats(user.id, weeksNumber);
  }
}

