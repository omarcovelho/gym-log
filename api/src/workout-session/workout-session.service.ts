import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { UpdateSetDto } from './dto/update-set.dto'
import { FinishWorkoutDto } from './dto/finish-workout.dto'
import { UpdateWorkoutExerciseDto } from './dto/update-session.dto'
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
                include: { exercises: { include: { sets: true, exercise: true } } },
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
            include: { exercises: { include: { sets: true, exercise: true } } },
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
                exercises: { include: { sets: true, exercise: true } },
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

    /** Busca estatísticas do usuário para dashboard */
    async getUserStats(userId: string) {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Total de treinos (últimos 30 dias) - apenas finalizados
        const totalWorkouts = await this.prisma.workoutSession.count({
            where: {
                userId,
                startAt: { gte: thirtyDaysAgo },
                endAt: { not: null }, // Apenas treinos finalizados
            },
        });

        // Treinos do mês atual com dados completos para calcular volume
        const monthlySessions = await this.prisma.workoutSession.findMany({
            where: {
                userId,
                startAt: { gte: startOfMonth },
                endAt: { not: null }, // Apenas treinos finalizados
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

        // Calcular volume mensal
        let monthlyVolume = 0;
        monthlySessions.forEach((session) => {
            session.exercises.forEach((ex) => {
                ex.sets.forEach((set) => {
                    if (set.completed && set.actualLoad && set.actualReps) {
                        monthlyVolume += set.actualLoad * set.actualReps;
                    }
                });
            });
        });

        // Último treino finalizado
        const lastWorkout = await this.prisma.workoutSession.findFirst({
            where: {
                userId,
                endAt: { not: null }, // Apenas treinos finalizados
            },
            orderBy: { startAt: 'desc' },
            include: {
                exercises: {
                    include: {
                        sets: true,
                    },
                },
            },
        });

        let lastWorkoutVolume = 0;
        let lastWorkoutData: {
            id: string;
            title: string | null;
            date: Date;
            volume: number;
        } | null = null;
        if (lastWorkout && lastWorkout.endAt) {
            // Só processa se o treino estiver finalizado
            lastWorkout.exercises.forEach((ex) => {
                ex.sets.forEach((set) => {
                    if (set.completed && set.actualLoad && set.actualReps) {
                        lastWorkoutVolume += set.actualLoad * set.actualReps;
                    }
                });
            });

            lastWorkoutData = {
                id: lastWorkout.id,
                title: lastWorkout.title,
                date: lastWorkout.startAt,
                volume: lastWorkoutVolume,
            };
        }

        // Treinos dos últimos 30 dias para histórico de volume
        const recentSessions = await this.prisma.workoutSession.findMany({
            where: {
                userId,
                startAt: { gte: thirtyDaysAgo },
                endAt: { not: null },
            },
            include: {
                exercises: {
                    include: {
                        sets: true,
                    },
                },
            },
            orderBy: { startAt: 'asc' },
        });

        // Agrupar volume por dia
        const volumeByDay = new Map<string, number>();
        recentSessions.forEach((session) => {
            const dateKey = session.startAt.toISOString().split('T')[0];
            let dayVolume = 0;
            session.exercises.forEach((ex) => {
                ex.sets.forEach((set) => {
                    if (set.completed && set.actualLoad && set.actualReps) {
                        dayVolume += set.actualLoad * set.actualReps;
                    }
                });
            });
            volumeByDay.set(dateKey, (volumeByDay.get(dateKey) || 0) + dayVolume);
        });

        // Criar array de histórico (30 dias)
        const volumeHistory: Array<{ date: string; volume: number }> = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateKey = date.toISOString().split('T')[0];
            volumeHistory.push({
                date: dateKey,
                volume: volumeByDay.get(dateKey) || 0,
            });
        }

        // PRs recentes (últimos 7 dias) - simplificado por enquanto
        // TODO: Implementar cálculo real de PRs comparando com histórico
        const recentPRs: Array<{
            exerciseName: string;
            type: 'load' | 'reps' | 'volume';
            value: number;
            unit?: string;
        }> = [];

        return {
            totalWorkouts,
            monthlyVolume,
            recentPRs: recentPRs.slice(0, 5), // Máximo 5 para mobile
            volumeHistory,
            lastWorkout: lastWorkoutData,
        };
    }

}
