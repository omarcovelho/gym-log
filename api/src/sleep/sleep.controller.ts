import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SleepService } from './sleep.service';
import { CreateSleepDto } from './dto/create-sleep.dto';
import { UpdateSleepDto } from './dto/update-sleep.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Sleep')
@ApiBearerAuth()
@Controller('sleep')
@UseGuards(JwtAuthGuard)
export class SleepController {
  constructor(private readonly service: SleepService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new sleep record' })
  @ApiResponse({ status: 201, description: 'Sleep record created successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  create(@CurrentUser() user, @Body() dto: CreateSleepDto) {
    return this.service.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sleep records with pagination' })
  @ApiResponse({ status: 200, description: 'Sleep records retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findAll(@CurrentUser() user, @Query() pagination: PaginationDto) {
    return this.service.findAll(user.id, pagination);
  }

  @Get('latest')
  @ApiOperation({ summary: 'Get the latest sleep record' })
  @ApiResponse({ status: 200, description: 'Latest sleep record retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getLatest(@CurrentUser() user) {
    return this.service.getLatest(user.id);
  }

  @Get('check-today')
  @ApiOperation({ summary: 'Check if user has recorded sleep today' })
  @ApiResponse({ status: 200, description: 'Check result retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async checkToday(@CurrentUser() user) {
    const hasSleep = await this.service.hasSleepToday(user.id);
    return { hasSleep };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get sleep statistics with weekly trends' })
  @ApiQuery({ name: 'weeks', required: false, type: Number, description: 'Number of weeks to analyze (default: 8)' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (ISO string)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getStats(
    @CurrentUser() user,
    @Query('weeks') weeks?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const weeksNumber = weeks ? parseInt(weeks, 10) : undefined;
    const startDateObj = startDate ? new Date(startDate) : null;
    const endDateObj = endDate ? new Date(endDate) : null;
    return this.service.getSleepStats(user.id, weeksNumber, startDateObj, endDateObj);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific sleep record by ID' })
  @ApiResponse({ status: 200, description: 'Sleep record retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Sleep record not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findOne(@CurrentUser() user, @Param('id') id: string) {
    return this.service.findById(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a sleep record' })
  @ApiResponse({ status: 200, description: 'Sleep record updated successfully.' })
  @ApiResponse({ status: 404, description: 'Sleep record not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  update(@CurrentUser() user, @Param('id') id: string, @Body() dto: UpdateSleepDto) {
    return this.service.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a sleep record' })
  @ApiResponse({ status: 200, description: 'Sleep record deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Sleep record not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  remove(@CurrentUser() user, @Param('id') id: string) {
    return this.service.delete(user.id, id);
  }
}

