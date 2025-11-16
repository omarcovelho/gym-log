import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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

  async remove(id: string, userId: string, userRole: string) {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id },
      select: { id: true, isGlobal: true, createdById: true },
    })

    if (!exercise) {
      throw new NotFoundException('Exercise not found')
    }

    // Se o exercício é global, apenas admin pode deletar
    if (exercise.isGlobal && userRole !== 'ADMIN') {
      throw new ForbiddenException('Only admins can delete global exercises')
    }

    // Se não é global, apenas o criador pode deletar (ou admin)
    if (!exercise.isGlobal && exercise.createdById !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You can only delete your own exercises')
    }

    return this.prisma.exercise.delete({ where: { id } })
  }
}
