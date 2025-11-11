import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common'
import { CreateWorkoutTemplateDto } from './dto/create-workout-template.dto'
import { WorkoutTemplateService } from './workout-template.service'
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard'
import { CurrentUser } from 'src/common/decorators/current-user'

@UseGuards(JwtAuthGuard)
@Controller('workout-templates')
export class WorkoutTemplateController {
  constructor(private service: WorkoutTemplateService) {}

  @Get()
  async list(@CurrentUser() user: any) {
    return this.service.listByOwner(user.id)
  }

  @Post()
  async create(@CurrentUser() user: any, @Body() dto: CreateWorkoutTemplateDto) {
    return this.service.create(user.id, dto)
  }

  @Delete(':id')
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    await this.service.delete(id, user.id)
    return { ok: true }
  }
}
