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
            include: {
                intensityBlocks: true,
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

        const updateData: any = {
            actualLoad: data.actualLoad,
            actualReps: data.actualReps,
            actualRir: data.actualRir,
            completed: data.completed,
            notes: data.notes,
        }

        if (data.intensityType !== undefined) {
            updateData.intensityType = data.intensityType
        }

        const updated = await this.prisma.sessionSet.update({
            where: { id: setId },
            data: updateData,
        });

        // Sincronizar blocos de intensidade, se enviados
        if (data.intensityBlocks) {
            const existingBlocks = await this.prisma.sessionSetIntensityBlock.findMany({
                where: { sessionSetId: setId },
            })

            const incomingIds = data.intensityBlocks
                .map((b) => b.id)
                .filter((id): id is string => !!id)

            const toDelete = existingBlocks.filter(
                (b) => !incomingIds.includes(b.id),
            )

            if (toDelete.length > 0) {
                await this.prisma.sessionSetIntensityBlock.deleteMany({
                    where: { id: { in: toDelete.map((b) => b.id) } },
                })
            }

            for (const block of data.intensityBlocks) {
                if (block.id) {
                    const updateData: any = {
                        blockIndex: block.blockIndex,
                        restSeconds: block.restSeconds ?? null,
                    }
                    if (typeof block.reps === 'number') {
                        updateData.reps = block.reps
                    }
                    if (typeof block.load === 'number') {
                        updateData.load = block.load
                    } else if (block.load === null) {
                        updateData.load = null
                    }

                    await this.prisma.sessionSetIntensityBlock.update({
                        where: { id: block.id },
                        data: updateData,
                    })
                } else {
                    await this.prisma.sessionSetIntensityBlock.create({
                        data: {
                            sessionSetId: setId,
                            blockIndex: block.blockIndex,
                            // se reps não vier, default 0 para satisfazer o schema
                            reps: typeof block.reps === 'number' ? block.reps : 0,
                            restSeconds: block.restSeconds ?? null,
                            load: typeof block.load === 'number' ? block.load : null,
                        },
                    })
                }
            }
        }

        return updated;
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
                        include: {
                            sets: {
                                include: {
                                    intensityBlocks: true,
                                },
                            },
                            exercise: true,
                        },
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

    /**
     * Calcula o volume ajustado de um set, incluindo intensity blocks e fator de intensidade (FI)
     * Mesma lógica do StatisticsService
     */
    private calculateSetVolume(set: {
        actualLoad?: number | null;
        actualReps?: number | null;
        intensityType?: string | null;
        intensityBlocks?: Array<{
            reps: number | null;
            load?: number | null;
        }>;
    }): number {
        // Se não tem carga ou reps, volume é 0
        if (!set.actualLoad || !set.actualReps) {
            return 0;
        }

        // Se não tem intensity blocks ou tipo é NONE, retorna volume normal
        if (
            !set.intensityType ||
            set.intensityType === 'NONE' ||
            !set.intensityBlocks ||
            set.intensityBlocks.length === 0
        ) {
            return Math.round(set.actualLoad * set.actualReps);
        }

        const blocks = set.intensityBlocks;
        const blocksCount = blocks.length;

        if (set.intensityType === 'REST_PAUSE') {
            // REST_PAUSE: total_reps = actualReps + sum(reps dos blocks)
            const totalRepsBlocks = blocks.reduce((sum, block) => sum + (block.reps || 0), 0);
            const totalReps = set.actualReps + totalRepsBlocks;
            const volumeBase = set.actualLoad * totalReps;

            // Calcular FI baseado no número de blocks
            let fi = 1.0;
            if (blocksCount === 1) {
                fi = 1.10; // leve
            } else if (blocksCount === 2) {
                fi = 1.15; // médio
            } else if (blocksCount >= 3) {
                fi = 1.25; // pesado
            }

            return Math.round(volumeBase * fi);
        } else if (set.intensityType === 'DROP_SET') {
            // DROP_SET: volume_base = Σ (carga_i × reps_i)
            // Set principal
            const mainVolume = set.actualLoad * set.actualReps;
            // Volume dos blocks
            const blocksVolume = blocks.reduce(
                (sum, block) => sum + ((block.load || 0) * (block.reps || 0)),
                0,
            );
            const volumeBase = mainVolume + blocksVolume;

            // Calcular FI baseado no número de blocks (quedas)
            let fi = 1.0;
            if (blocksCount === 1) {
                fi = 1.25; // simples
            } else if (blocksCount === 2) {
                fi = 1.40; // duplo
            } else if (blocksCount >= 3) {
                fi = 1.50; // triplo
            }

            return Math.round(volumeBase * fi);
        }

        // Fallback: volume normal se tipo não reconhecido
        return Math.round(set.actualLoad * set.actualReps);
    }

    /**
     * Calcula sets equivalentes de um set, incluindo fator de intensidade (FI)
     * Sets reais = 1, Sets equivalentes = 1 × FI
     * Mesma lógica do StatisticsService
     */
    private calculateSetEquivalentSets(set: {
        intensityType?: string | null;
        intensityBlocks?: Array<{
            reps: number | null;
            load?: number | null;
        }>;
    }): number {
        // Se não tem intensity blocks ou tipo é NONE, retorna 1.0 (set normal)
        if (
            !set.intensityType ||
            set.intensityType === 'NONE' ||
            !set.intensityBlocks ||
            set.intensityBlocks.length === 0
        ) {
            return 1.0;
        }

        const blocksCount = set.intensityBlocks.length;

        if (set.intensityType === 'REST_PAUSE') {
            // REST_PAUSE: sets equivalentes = 1 × FI
            if (blocksCount === 1) {
                return Math.round(1.10); // leve
            } else if (blocksCount === 2) {
                return Math.round(1.15); // médio
            } else if (blocksCount >= 3) {
                return Math.round(1.25); // pesado
            }
        } else if (set.intensityType === 'DROP_SET') {
            // DROP_SET: sets equivalentes = 1 × FI
            if (blocksCount === 1) {
                return Math.round(1.25); // simples
            } else if (blocksCount === 2) {
                return Math.round(1.40); // duplo
            } else if (blocksCount >= 3) {
                return Math.round(1.50); // triplo
            }
        }

        // Fallback: set normal
        return 1;
    }

    /** Busca sessão específica */
    async findById(userId: string, sessionId: string) {
        const session = await this.prisma.workoutSession.findUnique({
            where: { id: sessionId },
            include: {
                exercises: {
                    include: {
                        sets: {
                            include: {
                                intensityBlocks: true,
                            },
                        },
                        exercise: true,
                    },
                    orderBy: {
                        order: 'asc',
                    },
                } 
            },
        })
        if (!session || session.userId !== userId)
            throw new ForbiddenException('Access denied')
        
        // Calcular volume total do treino
        let totalVolume = 0;
        session.exercises.forEach((ex) => {
            ex.sets.forEach((set) => {
                if (set.completed) {
                    totalVolume += this.calculateSetVolume(set);
                }
            });
        });

        // Calcular volume por grupo muscular
        const exercisesByGroup = new Map<string, typeof session.exercises>();
        const firstAppearanceOrder = new Map<string, number>();
        
        session.exercises.forEach((ex, index) => {
            const muscleGroup = ex.exercise.muscleGroup;
            // Filtrar grupos null ou OTHER
            if (!muscleGroup || muscleGroup === 'OTHER') return;
            
            if (!exercisesByGroup.has(muscleGroup)) {
                exercisesByGroup.set(muscleGroup, []);
                firstAppearanceOrder.set(muscleGroup, index);
            }
            exercisesByGroup.get(muscleGroup)!.push(ex);
        });

        const volumeByGroup = Array.from(exercisesByGroup.entries())
            .map(([muscleGroup, exercises]) => {
                const groupVolume = exercises.reduce((groupVol, ex) => {
                    const exerciseVolume = ex.sets.reduce(
                        (acc, s) => (s.completed ? acc + this.calculateSetVolume(s) : acc),
                        0
                    );
                    return groupVol + exerciseVolume;
                }, 0);
                
                // Calcular sets equivalentes (inclui FI)
                const totalSets = exercises.reduce((acc, ex) => {
                    const exerciseSets = ex.sets.reduce(
                        (setAcc, s) => (s.completed ? setAcc + this.calculateSetEquivalentSets(s) : setAcc),
                        0
                    );
                    return acc + exerciseSets;
                }, 0);
                
                const exerciseCount = exercises.length;
                
                return {
                    muscleGroup,
                    volume: Math.round(groupVolume),
                    sets: Math.round(totalSets),
                    exerciseCount,
                    firstOrder: firstAppearanceOrder.get(muscleGroup) ?? 999,
                };
            })
            .sort((a, b) => a.firstOrder - b.firstOrder);

        return {
            ...session,
            totalVolume: Math.round(totalVolume),
            volumeByGroup,
        };
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
                    include: {
                        sets: {
                            include: {
                                intensityBlocks: true,
                            },
                        },
                        exercise: true,
                    },
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

    async startFreeWorkout(userId: string, title: string) {
        return this.prisma.workoutSession.create({
            data: {
                userId,
                title,
                exercises: { create: [] },
            },
            include: {
                exercises: {
                    include: {
                        sets: {
                            include: {
                                intensityBlocks: true,
                            },
                        },
                        exercise: true,
                    },
                },
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

        const updatedExercise = await this.prisma.sessionExercise.update({
            where: { id },
            data: {
                order: dto.order,
                notes: dto.notes,
                // campos simples de set são atualizados via updateMany; blocos serão sincronizados abaixo
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
                            intensityType: s.intensityType,
                        }
                    })) ?? [],
                }
            },
            include: {
                sets: {
                    include: {
                        intensityBlocks: true,
                    },
                },
                exercise: true,
            }
        })

        // Sincronizar blocos de intensidade por set, se enviados
        if (dto.sets) {
            for (const setDto of dto.sets) {
                if (!setDto.intensityBlocks) continue

                const existingBlocks = await this.prisma.sessionSetIntensityBlock.findMany({
                    where: { sessionSetId: setDto.id },
                })

                const incomingIds = setDto.intensityBlocks
                    .map((b) => b.id)
                    .filter((id): id is string => !!id)

                const toDelete = existingBlocks.filter(
                    (b) => !incomingIds.includes(b.id),
                )

                if (toDelete.length > 0) {
                    await this.prisma.sessionSetIntensityBlock.deleteMany({
                        where: { id: { in: toDelete.map((b) => b.id) } },
                    })
                }

                for (const block of setDto.intensityBlocks) {
                    if (block.id) {
                        const updateData: any = {
                            blockIndex: block.blockIndex,
                            restSeconds: block.restSeconds ?? null,
                        }
                        if (typeof block.reps === 'number') {
                            updateData.reps = block.reps
                        }
                        if (typeof block.load === 'number') {
                            updateData.load = block.load
                        } else if (block.load === null) {
                            updateData.load = null
                        }

                        await this.prisma.sessionSetIntensityBlock.update({
                            where: { id: block.id },
                            data: updateData,
                        })
                    } else {
                        await this.prisma.sessionSetIntensityBlock.create({
                            data: {
                                sessionSetId: setDto.id,
                                blockIndex: block.blockIndex,
                                reps: typeof block.reps === 'number' ? block.reps : 0,
                                restSeconds: block.restSeconds ?? null,
                                load: typeof block.load === 'number' ? block.load : null,
                            },
                        })
                    }
                }
            }
        }

        return updatedExercise
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
