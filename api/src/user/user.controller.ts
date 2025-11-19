import { Controller, Put, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateStatsDto } from './dto/update-stats.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user';

@ApiTags('User')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Put('stats')
  @ApiOperation({ summary: 'Update user statistics' })
  @ApiResponse({ status: 200, description: 'User statistics updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateStats(@CurrentUser() user: { id: string }, @Body() dto: UpdateStatsDto) {
    return this.userService.updateStats(user.id, dto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, description: 'User statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStats(@CurrentUser() user: { id: string }) {
    return this.userService.getStats(user.id);
  }
}

