import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateWorkoutTemplateDto } from './dto/create-workout-template.dto';
import { UpdateWorkoutTemplateDto } from './dto/update-workout-template.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WorkoutTemplateService {

    constructor(private readonly prisma: PrismaService) { }

    private includeDefault = {
        items: { include: { exercise: true } },
    }

    async create(ownerId: string, dto: CreateWorkoutTemplateDto) {
        return this.prisma.workoutTemplate.create({
            data: {
                title: dto.title,
                ownerId,
                items: {
                    create: dto.items.map(i => ({
                        exerciseId: i.exerciseId,
                        order: i.order,
                        target: i.target,
                    })),
                },
            },
            include: this.includeDefault,
        })
    }

    async findAllByOwner(ownerId: string) {
        return this.prisma.workoutTemplate.findMany({
            where: { ownerId },
            orderBy: { createdAt: 'desc' },
            include: this.includeDefault,
        })
    }

    async findOneOwned(ownerId: string, id: string) {
        const tpl = await this.prisma.workoutTemplate.findUnique({
            where: { id },
            include: this.includeDefault,
        })
        if (!tpl) throw new NotFoundException('Template not found')
        if (tpl.ownerId !== ownerId) throw new ForbiddenException()
        return tpl
    }

    async updateOwned(ownerId: string, id: string, dto: UpdateWorkoutTemplateDto) {
        const existing = await this.prisma.workoutTemplate.findUnique({ where: { id } })
        if (!existing) throw new NotFoundException('Template not found')
        if (existing.ownerId !== ownerId) throw new ForbiddenException()

        // Se veio items no payload, substitui todos (idempotente e previsível)
        if (dto.items) {
            return this.prisma.$transaction(async tx => {
                await tx.templateExercise.deleteMany({ where: { templateId: id } })
                const updated = await tx.workoutTemplate.update({
                    where: { id },
                    data: {
                        title: dto.title ?? existing.title,
                        items: {
                            create: dto.items!.map(i => ({
                                exerciseId: i.exerciseId,
                                order: i.order,
                                target: i.target,
                            })),
                        },
                    },
                    include: this.includeDefault,
                })
                return updated
            })
        }

        // Só atualiza campos do template
        return this.prisma.workoutTemplate.update({
            where: { id },
            data: { title: dto.title ?? existing.title },
            include: this.includeDefault,
        })
    }

    async removeOwned(ownerId: string, id: string) {
        const existing = await this.prisma.workoutTemplate.findUnique({ where: { id } })
        if (!existing) throw new NotFoundException('Template not found')
        if (existing.ownerId !== ownerId) throw new ForbiddenException()

        return this.prisma.$transaction(async tx => {
            await tx.templateExercise.deleteMany({ where: { templateId: id } })
            return tx.workoutTemplate.delete({ where: { id } })
        })
    }
}
