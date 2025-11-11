import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ExerciseService {

  constructor(private readonly prisma: PrismaService) {}
    
  create(createExerciseDto: CreateExerciseDto, createdById: string) {
    return this.prisma.exercise.create({
      data: {
        ...createExerciseDto,
        createdById,
      },
    });
  }

  findAll() {
    return this.prisma.exercise.findMany({ orderBy: { name: 'asc' } })
  }

  async findOne(id: string) {
    const exercise = await this.prisma.exercise.findUnique({ where: { id } })
    if (!exercise) throw new NotFoundException('Exercise not found')
    return exercise
  }

  update(id: string, updateExerciseDto: UpdateExerciseDto) {
    return this.prisma.exercise.update({ where: { id }, data: updateExerciseDto })
  }

  remove(id: string) {
    return this.prisma.exercise.delete({ where: { id } })
  }
}
