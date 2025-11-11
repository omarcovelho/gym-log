import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { WorkoutTemplateService } from './workout-template.service';
import { CreateWorkoutTemplateDto } from './dto/create-workout-template.dto';
import { UpdateWorkoutTemplateDto } from './dto/update-workout-template.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { CurrentUser } from 'src/common/decorators/current-user';


@ApiTags('Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('templates')
export class WorkoutTemplateController {
  constructor(private readonly service: WorkoutTemplateService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateWorkoutTemplateDto) {
    return this.service.create(user.id, dto)
  }

  @Get()
  findMine(@CurrentUser() user: any) {
    return this.service.findAllByOwner(user.id)
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.findOneOwned(user.id, id)
  }

  @Patch(':id')
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateWorkoutTemplateDto,
  ) {
    return this.service.updateOwned(user.id, id, dto)
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.removeOwned(user.id, id)
  }
}
