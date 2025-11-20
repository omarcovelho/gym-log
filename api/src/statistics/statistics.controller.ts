import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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
}

