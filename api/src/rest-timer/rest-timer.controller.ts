import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RestTimerService } from './rest-timer.service';
import { CreateRestTimerDto } from './dto/create-rest-timer.dto';
import { UpdateRestTimerDto } from './dto/update-rest-timer.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { CurrentUser } from 'src/common/decorators/current-user';

@ApiTags('Rest Timers')
@ApiBearerAuth()
@Controller('rest-timers')
@UseGuards(JwtAuthGuard)
export class RestTimerController {
  constructor(private readonly restTimerService: RestTimerService) {}

  @Get()
  @ApiOperation({ summary: 'Get all rest timers (default + custom)' })
  @ApiResponse({ status: 200, description: 'List of timers returned successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findAll(@CurrentUser() user) {
    return this.restTimerService.findAll(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a custom rest timer' })
  @ApiResponse({ status: 201, description: 'Timer created successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  create(@CurrentUser() user, @Body() createDto: CreateRestTimerDto) {
    return this.restTimerService.create(user.id, createDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a custom rest timer' })
  @ApiResponse({ status: 200, description: 'Timer updated successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot edit default timers or timers owned by others.' })
  @ApiResponse({ status: 404, description: 'Timer not found.' })
  update(
    @Param('id') id: string,
    @CurrentUser() user,
    @Body() updateDto: UpdateRestTimerDto,
  ) {
    return this.restTimerService.update(id, user.id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a custom rest timer' })
  @ApiResponse({ status: 200, description: 'Timer deleted successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot delete default timers or timers owned by others.' })
  @ApiResponse({ status: 404, description: 'Timer not found.' })
  remove(@Param('id') id: string, @CurrentUser() user) {
    return this.restTimerService.remove(id, user.id);
  }
}

