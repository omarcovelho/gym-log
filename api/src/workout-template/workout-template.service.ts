import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { CreateWorkoutTemplateDto } from './dto/create-workout-template.dto'
import { UpdateWorkoutTemplateDto } from './dto/update-workout-template.dto'
import { PaginationDto } from 'src/common/dto/pagination.dto'

@Injectable()
export class WorkoutTemplateService {
    constructor(private prisma: PrismaService) { }

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

    async listByOwner(ownerId: string, pagination: PaginationDto) {
        const { page = 1, limit = 10 } = pagination;
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.prisma.workoutTemplate.findMany({
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
                skip,
                take: limit,
            }),
            this.prisma.workoutTemplate.count({ where: { ownerId } }),
        ]);

        return {
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async delete(id: string, ownerId: string) {
        const existing = await this.prisma.workoutTemplate.findUnique({
            where: { id }
        })
        if (!existing) throw new NotFoundException('Template not found')
        if (existing.ownerId !== ownerId)
            throw new ForbiddenException('You do not own this template')

        return this.prisma.workoutTemplate.delete({ where: { id } })
    }

    async getById(id: string, userId: string) {
        const template = await this.prisma.workoutTemplate.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        exercise: true,
                        sets: true,
                    },
                    orderBy: { order: 'asc' },
                },
            },
        })

        if (!template) throw new NotFoundException('Template not found')
        if (template.ownerId !== userId)
            throw new ForbiddenException('You do not have access to this template')

        return template
    }

    async update(id: string, userId: string, dto: UpdateWorkoutTemplateDto) {
        const existing = await this.prisma.workoutTemplate.findUnique({
            where: { id },
            include: { items: { include: { sets: true } } },
        })

        if (!existing) throw new NotFoundException('Template not found')
        if (existing.ownerId !== userId)
            throw new ForbiddenException('You do not own this template')

        // Limpa relações antigas antes de recriar
        await this.prisma.templateSet.deleteMany({
            where: { templateExId: { in: existing.items.map((i) => i.id) } },
        })
        await this.prisma.templateExercise.deleteMany({
            where: { templateId: id },
        })

        // Cria de novo com base no payload atualizado
        const updated = await this.prisma.workoutTemplate.update({
            where: { id },
            data: {
                title: dto.title,
                notes: dto.notes ?? null,
                items: {
                    create: dto.items!.map((item) => ({
                        exerciseId: item.exerciseId,
                        order: item.order,
                        notes: item.notes ?? null,
                        sets: {
                            create: item.sets.map((s) => ({
                                setIndex: s.setIndex,
                                reps: s.reps ?? 0,
                                rir: s.rir ?? null,
                                notes: s.notes ?? null,
                            })),
                        },
                    })),
                },
            },
            include: {
                items: {
                    include: { exercise: true, sets: true },
                },
            },
        })

        return updated
    }

}
