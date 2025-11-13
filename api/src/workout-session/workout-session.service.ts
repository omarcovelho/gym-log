import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { UpdateSetDto } from './dto/update-set.dto'
import { FinishWorkoutDto } from './dto/finish-workout.dto'

@Injectable()
export class WorkoutSessionService {
    constructor(private prisma: PrismaService) { }

    /** Cria um treino com base em um template (snapshot completo) */
    async startFromTemplate(userId: string, templateId: string) {
        const template = await this.prisma.workoutTemplate.findUnique({
            where: { id: templateId },
            include: { items: { include: { sets: true } } },
        })

        if (!template) throw new NotFoundException('Template not found')

        console.log(template.title);
        const session = await this.prisma.workoutSession.create({
            data: {
                title: template.title,
                userId,
                templateId,
                exercises: {
                    create: template.items.map((item, idx) => ({
                        exerciseId: item.exerciseId,
                        order: idx,
                        notes: item.notes ?? null,
                        sets: {
                            create: item.sets.map((s) => ({
                                setIndex: s.setIndex,
                                plannedReps: s.reps ?? null,
                                plannedRir: s.rir ?? null,
                                notes: s.notes ?? null,
                            })),
                        },
                    })),
                },
            },
            include: { exercises: { include: { sets: true, exercise: true } } },
        })

        return session
    }

    /** Adiciona exercício manualmente ao treino */
    async addExercise(userId: string, sessionId: string, dto: any) {
        const session = await this.prisma.workoutSession.findUnique({
            where: { id: sessionId },
            select: { userId: true },
        })

        if (!session || session.userId !== userId)
            throw new ForbiddenException('Access denied')

        return this.prisma.sessionExercise.create({
            data: {
                sessionId,
                exerciseId: dto.exerciseId,
                notes: dto.notes ?? null,
                order: dto.order ?? 999,
            },
            include: { exercise: true, sets: true },
        })
    }

    /** Adiciona série a um exercício existente */
    async addSet(exerciseId: string, dto: any) {
        const count = await this.prisma.sessionSet.count({
            where: { sessionExId: exerciseId },
        })
        return this.prisma.sessionSet.create({
            data: {
                sessionExId: exerciseId,
                setIndex: dto.setIndex ?? count,
                plannedReps: dto.plannedReps ?? null,
                plannedRir: dto.plannedRir ?? null,
                notes: dto.notes ?? null,
            },
        })
    }

    /** Atualiza uma série (valores executados) */
    async updateSet(setId: string, data: UpdateSetDto) {
        return this.prisma.sessionSet.update({
            where: { id: setId },
            data,
        })
    }

    /** Finaliza o treino */
    async finishSession(sessionId: string, dto: FinishWorkoutDto) {
        const now = new Date()

        const session = await this.prisma.workoutSession.findUnique({
            where: { id: sessionId },
            select: { startAt: true },
        })
        if (!session) throw new Error('Session not found')

        const durationM = session.startAt
            ? Math.round((now.getTime() - session.startAt.getTime()) / 60000)
            : null

        return this.prisma.workoutSession.update({
            where: { id: sessionId },
            data: {
                endAt: now,
                durationM,
                feeling: dto.feeling ?? null,
                fatigue: dto.fatigue ?? null,
                notes: dto.notes ?? null,
            },
            include: {
                exercises: {
                    include: { sets: true },
                },
            },
        })
    }

    /** Lista sessões do usuário */
    async findAllForUser(userId: string) {
        return this.prisma.workoutSession.findMany({
            where: { userId },
            include: { exercises: { include: { sets: true, exercise: true } } },
            orderBy: { startAt: 'desc' },
        })
    }

    /** Busca sessão específica */
    async findById(userId: string, sessionId: string) {
        const session = await this.prisma.workoutSession.findUnique({
            where: { id: sessionId },
            include: { exercises: { include: { sets: true, exercise: true } } },
        })
        if (!session || session.userId !== userId)
            throw new ForbiddenException('Access denied')
        return session
    }

    async deleteSession(userId: string, sessionId: string) {
        const session = await this.prisma.workoutSession.findUnique({
            where: { id: sessionId },
            select: { id: true, userId: true },
        })

        if (!session) throw new NotFoundException('Session not found')
        if (session.userId !== userId) throw new ForbiddenException('Access denied')

        // Prisma vai deletar exercises + sets por cascade se configurado no schema
        return this.prisma.workoutSession.delete({
            where: { id: sessionId },
        })
    }

    async startFreeWorkout(userId: string) {
        return this.prisma.workoutSession.create({
            data: {
                userId,
                title: 'Free Workout',
                exercises: { create: [] },
            },
            include: {
                exercises: { include: { sets: true, exercise: true } },
            },
        })
    }

}
