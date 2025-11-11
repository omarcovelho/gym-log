import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { CreateWorkoutTemplateDto } from './dto/create-workout-template.dto'

@Injectable()
export class WorkoutTemplateService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateWorkoutTemplateDto) {
    return this.prisma.workoutTemplate.create({
      data: {
        title: dto.title,
        notes: dto.notes,
        ownerId,
        items: {
          create: dto.items.map(it => ({
            exerciseId: it.exerciseId,
            order: it.order,
            notes: it.notes,
            sets: {
              create: it.sets.map(s => ({
                setIndex: s.setIndex,
                reps: s.reps,
                rir: s.rir,
                notes: s.notes,
              })),
            },
          })),
        },
      },
      include: {
        items: {
          orderBy: { order: 'asc' },
          include: {
            exercise: true,
            sets: { orderBy: { setIndex: 'asc' } },
          },
        },
      },
    })
  }

  async listByOwner(ownerId: string) {
    return this.prisma.workoutTemplate.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          orderBy: { order: 'asc' },
          include: {
            exercise: true,
            sets: { orderBy: { setIndex: 'asc' } },
          },
        },
      },
    })
  }

  async delete(id: string, ownerId: string) {
    // opcional: validar owner
    return this.prisma.workoutTemplate.delete({ where: { id } })
  }
}
