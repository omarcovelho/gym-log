import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';

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

  findAll(pagination: PaginationDto) {
    const { page = 1, limit = 10, search, muscleGroup } = pagination;
    const skip = (page - 1) * limit;

    // Construir filtro de busca
    const where: any = {};
    
    if (search) {
      where.name = { contains: search, mode: 'insensitive' as const };
    }
    
    if (muscleGroup) {
      where.muscleGroup = muscleGroup;
    }

    return Promise.all([
      this.prisma.exercise.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.exercise.count({ where }),
    ]).then(([data, total]) => ({
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }));
  }

  async findOne(id: string) {
    console.log(id);
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
