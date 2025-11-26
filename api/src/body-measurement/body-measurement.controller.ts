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
import { BodyMeasurementService } from './body-measurement.service';
import { CreateBodyMeasurementDto } from './dto/create-body-measurement.dto';
import { UpdateBodyMeasurementDto } from './dto/update-body-measurement.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Body Measurements')
@ApiBearerAuth()
@Controller('body-measurements')
@UseGuards(JwtAuthGuard)
export class BodyMeasurementController {
  constructor(private readonly service: BodyMeasurementService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new body measurement' })
  @ApiResponse({ status: 201, description: 'Measurement created successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  create(@CurrentUser() user, @Body() dto: CreateBodyMeasurementDto) {
    return this.service.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all body measurements with pagination' })
  @ApiResponse({ status: 200, description: 'Measurements retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findAll(@CurrentUser() user, @Query() pagination: PaginationDto) {
    return this.service.findAll(user.id, pagination);
  }

  @Get('latest')
  @ApiOperation({ summary: 'Get the latest body measurement' })
  @ApiResponse({ status: 200, description: 'Latest measurement retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getLatest(@CurrentUser() user) {
    return this.service.getLatest(user.id);
  }

  @Get('check-today')
  @ApiOperation({ summary: 'Check if user has measured today' })
  @ApiResponse({ status: 200, description: 'Check result retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async checkToday(@CurrentUser() user) {
    const hasMeasurement = await this.service.hasMeasurementToday(user.id);
    return { hasMeasurement };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get body measurements statistics with weekly trends' })
  @ApiQuery({ name: 'weeks', required: false, type: Number, description: 'Number of weeks to analyze (default: 8)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getStats(
    @CurrentUser() user,
    @Query('weeks') weeks?: string,
  ) {
    const weeksNumber = weeks ? parseInt(weeks, 10) : 8;
    return this.service.getMeasurementsStats(user.id, weeksNumber);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific body measurement by ID' })
  @ApiResponse({ status: 200, description: 'Measurement retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Measurement not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findOne(@CurrentUser() user, @Param('id') id: string) {
    return this.service.findById(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a body measurement' })
  @ApiResponse({ status: 200, description: 'Measurement updated successfully.' })
  @ApiResponse({ status: 404, description: 'Measurement not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  update(@CurrentUser() user, @Param('id') id: string, @Body() dto: UpdateBodyMeasurementDto) {
    return this.service.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a body measurement' })
  @ApiResponse({ status: 200, description: 'Measurement deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Measurement not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  remove(@CurrentUser() user, @Param('id') id: string) {
    return this.service.delete(user.id, id);
  }
}

