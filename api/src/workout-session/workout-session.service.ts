import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { UpdateSetDto } from './dto/update-set.dto'
import { FinishWorkoutDto } from './dto/finish-workout.dto'
import { UpdateWorkoutExerciseDto } from './dto/update-session.dto'
import { UpdateWorkoutSessionDto } from './dto/update-workout-session.dto'
import { PaginationDto } from 'src/common/dto/pagination.dto'

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
                sets: {
                    create: {
                        setIndex: 0,
                        plannedReps: null,
                        plannedRir: null,
                        notes: null,
                    },
                },
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
    async updateSet(setId: string, userId: string, data: UpdateSetDto) {
        // Verificar se o set pertence a uma sessão do usuário
        const set = await this.prisma.sessionSet.findUnique({
            where: { id: setId },
            include: {
                sessionEx: {
                    include: { session: true },
                },
            },
        });

        if (!set) throw new NotFoundException('Set not found');
        if (set.sessionEx.session.userId !== userId) {
            throw new ForbiddenException('Access denied');
        }

        return this.prisma.sessionSet.update({
            where: { id: setId },
            data,
        });
    }

    /** Finaliza o treino */
    async finishSession(sessionId: string, dto: FinishWorkoutDto) {
        const now = new Date()

        const session = await this.prisma.workoutSession.findUnique({
            where: { id: sessionId },
            select: { startAt: true },
        })
        if (!session) throw new NotFoundException('Session not found')

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
    async findAllForUser(userId: string, pagination: PaginationDto) {
        const { page = 1, limit = 10 } = pagination;
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.prisma.workoutSession.findMany({
                where: { userId },
                include: { 
                    exercises: { 
                        include: { sets: true, exercise: true },
                        orderBy: {
                            order: 'asc',
                        },
                    } 
                },
                orderBy: { startAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.workoutSession.count({ where: { userId } }),
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

    /** Busca sessão específica */
    async findById(userId: string, sessionId: string) {
        const session = await this.prisma.workoutSession.findUnique({
            where: { id: sessionId },
            include: { 
                exercises: { 
                    include: { sets: true, exercise: true },
                    orderBy: {
                        order: 'asc',
                    },
                } 
            },
        })
        if (!session || session.userId !== userId)
            throw new ForbiddenException('Access denied')
        return session
    }

    /** Busca treino em andamento (sem endAt) */
    async findActiveWorkout(userId: string) {
        const session = await this.prisma.workoutSession.findFirst({
            where: {
                userId,
                endAt: null,
            },
            include: {
                exercises: { 
                    include: { sets: true, exercise: true },
                    orderBy: {
                        order: 'asc',
                    },
                },
            },
            orderBy: { startAt: 'desc' },
        })
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

    async updateExercise(id: string, userId: string, dto: UpdateWorkoutExerciseDto) {
        // Verificar se o exercício pertence a uma sessão do usuário
        const exercise = await this.prisma.sessionExercise.findUnique({
            where: { id },
            include: { session: true },
        });

        if (!exercise) throw new NotFoundException('Exercise not found');
        if (exercise.session.userId !== userId) {
            throw new ForbiddenException('Access denied');
        }

        return this.prisma.sessionExercise.update({
            where: { id },
            data: {
                order: dto.order,
                notes: dto.notes,
                sets: {
                    updateMany: dto.sets?.map(s => ({
                        where: { id: s.id },
                        data: {
                            setIndex: s.setIndex,
                            plannedReps: s.plannedReps,
                            plannedRir: s.plannedRir,
                            actualLoad: s.actualLoad,
                            actualReps: s.actualReps,
                            actualRir: s.actualRir,
                            completed: s.completed,
                            notes: s.notes,
                        }
                    })) ?? [],
                }
            },
            include: {
                sets: true,
                exercise: true,
            }
        })
    }

    async deleteExercise(id: string, userId: string) {
        // Verificar se o exercício pertence a uma sessão do usuário
        const exercise = await this.prisma.sessionExercise.findUnique({
            where: { id },
            include: { session: true },
        });

        if (!exercise) throw new NotFoundException('Exercise not found');
        if (exercise.session.userId !== userId) {
            throw new ForbiddenException('Access denied');
        }

        // Prisma vai deletar sets por cascade se configurado no schema
        return this.prisma.sessionExercise.delete({
            where: { id },
        });
    }

    async deleteSet(setId: string, userId: string) {
        // Verificar se o set pertence a uma sessão do usuário
        const set = await this.prisma.sessionSet.findUnique({
            where: { id: setId },
            include: {
                sessionEx: {
                    include: { session: true },
                },
            },
        });

        if (!set) throw new NotFoundException('Set not found');
        if (set.sessionEx.session.userId !== userId) {
            throw new ForbiddenException('Access denied');
        }

        return this.prisma.sessionSet.delete({
            where: { id: setId },
        });
    }

    async updateSession(id: string, userId: string, dto: UpdateWorkoutSessionDto) {
        // Verificar se a sessão pertence ao usuário
        const session = await this.prisma.workoutSession.findUnique({
            where: { id },
        });

        if (!session) throw new NotFoundException('Session not found');
        if (session.userId !== userId) {
            throw new ForbiddenException('Access denied');
        }

        return this.prisma.workoutSession.update({
            where: { id },
            data: {
                title: dto.title,
                notes: dto.notes,
            },
            include: {
                exercises: {
                    include: {
                        sets: true,
                        exercise: true,
                    },
                },
            },
        });
    }

}
