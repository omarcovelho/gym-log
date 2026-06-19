import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { estimateOneRepMaxEpley } from './one-rep-max.util';
import { buildSessionWhere, getWeekKey } from './session-query.util';
import { buildPeriodSummary } from './period-summary.util';
import { buildEvolutionPeriodSummary } from './evolution-period-summary.util';

export type ProgressGranularity = 'week' | 'session';

const sessionInclude = {
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
} as const;

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calcula o volume ajustado de um set, incluindo intensity blocks e fator de intensidade (FI)
   * @param set Set com intensityBlocks incluídos
   * @returns Volume ajustado do set
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
      const totalRepsBlocks = blocks.reduce(
        (sum, block) => sum + (block.reps || 0),
        0,
      );
      const totalReps = set.actualReps + totalRepsBlocks;
      const volumeBase = set.actualLoad * totalReps;

      // Calcular FI baseado no número de blocks
      let fi = 1.0;
      if (blocksCount === 1) {
        fi = 1.1; // leve
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
        (sum, block) => sum + (block.load || 0) * (block.reps || 0),
        0,
      );
      const volumeBase = mainVolume + blocksVolume;

      // Calcular FI baseado no número de blocks (quedas)
      let fi = 1.0;
      if (blocksCount === 1) {
        fi = 1.25; // simples
      } else if (blocksCount === 2) {
        fi = 1.4; // duplo
      } else if (blocksCount >= 3) {
        fi = 1.5; // triplo
      }

      return Math.round(volumeBase * fi);
    }

    // Fallback: volume normal se tipo não reconhecido
    return Math.round(set.actualLoad * set.actualReps);
  }

  /**
   * Calcula sets equivalentes de um set, incluindo fator de intensidade (FI)
   * Sets reais = 1, Sets equivalentes = 1 × FI
   * @param set Set com intensityBlocks incluídos
   * @returns Sets equivalentes (1 × FI) ou 1.0 se não tiver intensity blocks
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
        return Math.round(1.1); // leve
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
        return Math.round(1.4); // duplo
      } else if (blocksCount >= 3) {
        return Math.round(1.5); // triplo
      }
    }

    // Fallback: set normal
    return 1;
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
            sets: {
              include: {
                intensityBlocks: true,
              },
            },
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
          if (set.completed) {
            monthlyVolume += this.calculateSetVolume(set);
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
            sets: {
              include: {
                intensityBlocks: true,
              },
            },
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
          if (set.completed) {
            lastWorkoutVolume += this.calculateSetVolume(set);
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
            sets: {
              include: {
                intensityBlocks: true,
              },
            },
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
          if (set.completed) {
            dayVolume += this.calculateSetVolume(set);
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
      monthlyVolume: Math.round(monthlyVolume),
      recentPRs: recentPRs.slice(0, 5), // Máximo 5 para mobile
      volumeHistory: volumeHistory.map((item) => ({
        ...item,
        volume: Math.round(item.volume),
      })),
      lastWorkout: lastWorkoutData
        ? {
            ...lastWorkoutData,
            volume: Math.round(lastWorkoutData.volume),
          }
        : null,
    };
  }

  /** Resolve default date range for evolution stats */
  private resolveEvolutionDateRange(
    startDate?: Date | null,
    endDate?: Date | null,
    weeks?: number,
  ): { dateStart: Date; dateEnd: Date } {
    const now = new Date();
    let dateStart: Date;
    let dateEnd: Date;

    if (startDate && endDate) {
      dateStart = new Date(startDate);
      dateStart.setHours(0, 0, 0, 0);
      dateEnd = new Date(endDate);
      dateEnd.setHours(23, 59, 59, 999);
    } else if (weeks) {
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const startOfCurrentWeek = new Date(today);
      startOfCurrentWeek.setDate(diff);
      startOfCurrentWeek.setHours(0, 0, 0, 0);
      dateStart = new Date(
        startOfCurrentWeek.getTime() - (weeks - 1) * 7 * 24 * 60 * 60 * 1000,
      );
      dateStart.setHours(0, 0, 0, 0);
      dateEnd = new Date(now);
      dateEnd.setHours(23, 59, 59, 999);
    } else {
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const startOfCurrentWeek = new Date(today);
      startOfCurrentWeek.setDate(diff);
      startOfCurrentWeek.setHours(0, 0, 0, 0);
      dateStart = new Date(
        startOfCurrentWeek.getTime() - 3 * 7 * 24 * 60 * 60 * 1000,
      );
      dateStart.setHours(0, 0, 0, 0);
      dateEnd = new Date(now);
      dateEnd.setHours(23, 59, 59, 999);
    }

    return { dateStart, dateEnd };
  }

  /** Accumulate volume/sets for a session into muscle-group buckets */
  private accumulateSessionVolume(
    session: {
      exercises: Array<{
        exercise: { muscleGroup: string | null; name: string };
        sets: Array<
          Parameters<StatisticsService['calculateSetVolume']>[0] & {
            completed: boolean;
          }
        >;
      }>;
    },
    target: {
      volume: number;
      sets: number;
      byMuscleGroup: Map<string, { volume: number; sets: number }>;
    },
  ): void {
    session.exercises.forEach((ex) => {
      if (!ex.exercise.muscleGroup || ex.exercise.muscleGroup === 'OTHER') {
        return;
      }

      const muscleGroup = ex.exercise.muscleGroup;

      if (!target.byMuscleGroup.has(muscleGroup)) {
        target.byMuscleGroup.set(muscleGroup, { volume: 0, sets: 0 });
      }

      const muscleGroupStats = target.byMuscleGroup.get(muscleGroup)!;

      ex.sets.forEach((set) => {
        const equivalentSets = this.calculateSetEquivalentSets(set);
        target.sets += equivalentSets;
        muscleGroupStats.sets += equivalentSets;

        const volume = this.calculateSetVolume(set);
        target.volume += volume;
        muscleGroupStats.volume += volume;
      });
    });
  }

  /** Busca estatísticas de evolução (PRs e volume semanal) */
  async getEvolutionStats(
    userId: string,
    startDate?: Date | null,
    endDate?: Date | null,
    weeks?: number, // Deprecated: manter apenas para compatibilidade
    tagIds?: string[],
    granularity: ProgressGranularity = 'week',
  ) {
    const { dateStart, dateEnd } = this.resolveEvolutionDateRange(
      startDate,
      endDate,
      weeks,
    );

    const sessions = await this.prisma.workoutSession.findMany({
      where: buildSessionWhere(userId, {
        startDate: dateStart,
        endDate: dateEnd,
        tagIds,
      }),
      include: sessionInclude,
      orderBy: { startAt: 'asc' },
    });

    // Calcular PRs de carga
    // Mapa: exerciseName -> { maxLoad, previousMaxLoad, date, workoutId }
    const exercisePRs = new Map<
      string,
      {
        maxLoad: number;
        previousMaxLoad: number;
        date: Date;
        workoutId: string;
      }
    >();

    // Histórico de cargas por exercício (para encontrar segunda maior)
    const exerciseLoadHistory = new Map<string, number[]>();

    sessions.forEach((session) => {
      session.exercises.forEach((ex) => {
        // Filtrar exercícios com muscleGroup null ou OTHER
        if (!ex.exercise.muscleGroup || ex.exercise.muscleGroup === 'OTHER') {
          return;
        }

        const exerciseName = ex.exercise.name;

        ex.sets.forEach((set) => {
          // Considerar apenas sets com actualLoad e actualReps preenchidos
          if (set.actualLoad != null && set.actualReps != null) {
            if (!exerciseLoadHistory.has(exerciseName)) {
              exerciseLoadHistory.set(exerciseName, []);
            }
            exerciseLoadHistory.get(exerciseName)!.push(set.actualLoad);
          }
        });
      });
    });

    // Encontrar PRs (maior carga) e segunda maior carga por exercício
    exerciseLoadHistory.forEach((loads, exerciseName) => {
      if (loads.length === 0) return;

      // Ordenar em ordem decrescente
      const sortedLoads = [...loads].sort((a, b) => b - a);
      const maxLoad = sortedLoads[0];
      const previousMaxLoad = sortedLoads.length > 1 ? sortedLoads[1] : maxLoad;

      // Encontrar a data do PR (primeira vez que essa carga foi atingida)
      let prDate: Date | null = null;
      let prWorkoutId: string | null = null;

      for (const session of sessions) {
        for (const ex of session.exercises) {
          if (ex.exercise.name === exerciseName) {
            for (const set of ex.sets) {
              if (
                set.actualLoad != null &&
                set.actualReps != null &&
                set.actualLoad === maxLoad
              ) {
                prDate = session.startAt;
                prWorkoutId = session.id;
                break;
              }
            }
            if (prDate) break;
          }
        }
        if (prDate) break;
      }

      if (prDate && prWorkoutId) {
        exercisePRs.set(exerciseName, {
          maxLoad,
          previousMaxLoad,
          date: prDate,
          workoutId: prWorkoutId,
        });
      }
    });

    const recentPRs = Array.from(exercisePRs.entries())
      .map(([exerciseName, pr]) => ({
        exerciseName,
        value: pr.maxLoad,
        previousValue: pr.previousMaxLoad,
        date: pr.date,
        workoutId: pr.workoutId,
        unit: 'kg',
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    const formatMuscleGroups = (
      byMuscleGroup: Map<string, { volume: number; sets: number }>,
    ) =>
      Object.fromEntries(
        Array.from(byMuscleGroup.entries()).map(([mg, data]) => [
          mg,
          { volume: Math.round(data.volume), sets: Math.round(data.sets) },
        ]),
      );

    if (granularity === 'session') {
      const sessionStats = sessions.map((session) => {
        const acc = {
          volume: 0,
          sets: 0,
          byMuscleGroup: new Map<string, { volume: number; sets: number }>(),
        };
        this.accumulateSessionVolume(session, acc);
        return {
          sessionId: session.id,
          sessionDate: session.startAt.toISOString(),
          volume: Math.round(acc.volume),
          sets: Math.round(acc.sets),
          byMuscleGroup: formatMuscleGroups(acc.byMuscleGroup),
        };
      });

      const periodSummary = buildEvolutionPeriodSummary(
        this.toEvolutionPeriodSummaryPoints(sessionStats),
      );

      return {
        recentPRs,
        granularity: 'session' as const,
        weeklyStats: [],
        sessionStats,
        periodSummary,
      };
    }

    const weeklyStatsMap = new Map<
      string,
      {
        volume: number;
        sets: number;
        byMuscleGroup: Map<string, { volume: number; sets: number }>;
      }
    >();

    sessions.forEach((session) => {
      const weekKey = getWeekKey(session.startAt);

      if (!weeklyStatsMap.has(weekKey)) {
        weeklyStatsMap.set(weekKey, {
          volume: 0,
          sets: 0,
          byMuscleGroup: new Map(),
        });
      }

      this.accumulateSessionVolume(session, weeklyStatsMap.get(weekKey)!);
    });

    const weeklyStats = Array.from(weeklyStatsMap.entries())
      .map(([week, stats]) => ({
        week,
        volume: Math.round(stats.volume),
        sets: Math.round(stats.sets),
        byMuscleGroup: formatMuscleGroups(stats.byMuscleGroup),
      }))
      .sort((a, b) => a.week.localeCompare(b.week));

    const periodSummary = buildEvolutionPeriodSummary(
      this.toEvolutionPeriodSummaryPoints(weeklyStats),
    );

    return {
      recentPRs,
      granularity: 'week' as const,
      weeklyStats,
      sessionStats: [],
      periodSummary,
    };
  }

  /** Aggregate exercise metrics from completed sets */
  private aggregateExerciseMetrics(
    sets: Array<{
      completed: boolean;
      actualLoad?: number | null;
      actualReps?: number | null;
      actualRir?: number | null;
      intensityType?: string | null;
      intensityBlocks?: Array<{ reps: number | null; load?: number | null }>;
    }>,
  ) {
    const loads: number[] = [];
    const volumes: number[] = [];
    const reps: number[] = [];
    const e1rms: number[] = [];
    let setsCount = 0;

    sets.forEach((set) => {
      if (!set.completed) return;

      const volume = this.calculateSetVolume(set);
      const equivalentSets = this.calculateSetEquivalentSets(set);
      if (set.actualLoad != null) {
        loads.push(set.actualLoad);
      }
      volumes.push(volume);
      if (set.actualReps != null) {
        reps.push(set.actualReps);
        if (set.actualLoad != null) {
          const e1rm = estimateOneRepMaxEpley(
            set.actualLoad,
            set.actualReps,
            set.actualRir,
          );
          if (e1rm != null) {
            e1rms.push(e1rm);
          }
        }
      }
      setsCount += equivalentSets;
    });

    return { loads, volumes, reps, e1rms, setsCount };
  }

  private buildProgressionPoint(data: {
    loads: number[];
    volumes: number[];
    reps: number[];
    e1rms: number[];
    setsCount: number;
  }) {
    return {
      avgLoad:
        data.loads.length > 0
          ? data.loads.reduce((a, b) => a + b, 0) / data.loads.length
          : 0,
      totalVolume: Math.round(data.volumes.reduce((a, b) => a + b, 0)),
      avgReps:
        data.reps.length > 0
          ? data.reps.reduce((a, b) => a + b, 0) / data.reps.length
          : 0,
      bestEstimated1RM: data.e1rms.length > 0 ? Math.max(...data.e1rms) : 0,
      setsCount: Math.round(data.setsCount),
    };
  }

  private toPeriodSummaryPoints(
    points: Array<{
      week?: string;
      sessionDate?: string;
      avgLoad: number;
      totalVolume: number;
      avgReps: number;
      bestEstimated1RM: number;
    }>,
  ) {
    return points.map((point) => ({
      avgLoad: point.avgLoad,
      totalVolume: point.totalVolume,
      avgReps: point.avgReps,
      bestEstimated1RM: point.bestEstimated1RM,
      atDate: point.sessionDate ?? point.week ?? '',
    }));
  }

  private toEvolutionPeriodSummaryPoints(
    points: Array<{
      week?: string;
      sessionDate?: string;
      volume: number;
      sets: number;
    }>,
  ) {
    return points.map((point) => ({
      volume: point.volume,
      sets: point.sets,
      atDate: point.sessionDate ?? point.week ?? '',
    }));
  }

  /** Busca progressão de um exercício específico */
  async getExerciseProgression(
    userId: string,
    exerciseId: string,
    startDate?: Date | null,
    endDate?: Date | null,
    tagIds?: string[],
    granularity: ProgressGranularity = 'week',
  ) {
    // Validar que o exercício existe
    const exercise = await this.prisma.exercise.findUnique({
      where: { id: exerciseId },
    });

    if (!exercise) {
      throw new BadRequestException('Exercise not found.');
    }

    let dateStart: Date | undefined;
    let dateEnd: Date | undefined;

    if (startDate && endDate) {
      dateStart = new Date(startDate);
      dateStart.setHours(0, 0, 0, 0);
      dateEnd = new Date(endDate);
      dateEnd.setHours(23, 59, 59, 999);
    }

    const sessions = await this.prisma.workoutSession.findMany({
      where: buildSessionWhere(userId, {
        startDate: dateStart,
        endDate: dateEnd,
        tagIds,
        exerciseId,
      }),
      include: {
        exercises: {
          where: { exerciseId },
          include: {
            sets: { include: { intensityBlocks: true } },
            exercise: true,
          },
        },
      },
      orderBy: { startAt: 'asc' },
    });

    if (granularity === 'session') {
      const sessionsData = sessions
        .map((session) => {
          const sets = session.exercises.flatMap((ex) => ex.sets);
          if (sets.length === 0) return null;

          const metrics = this.aggregateExerciseMetrics(sets);
          if (metrics.loads.length === 0 && metrics.volumes.length === 0) {
            return null;
          }

          return {
            sessionId: session.id,
            sessionDate: session.startAt.toISOString(),
            ...this.buildProgressionPoint(metrics),
          };
        })
        .filter((s): s is NonNullable<typeof s> => s != null);

      const periodSummary = buildPeriodSummary(
        this.toPeriodSummaryPoints(sessionsData),
      );

      return {
        granularity: 'session' as const,
        weeks: [],
        sessions: sessionsData,
        periodSummary,
      };
    }

    const weeklyDataMap = new Map<
      string,
      {
        loads: number[];
        volumes: number[];
        reps: number[];
        e1rms: number[];
        setsCount: number;
      }
    >();

    sessions.forEach((session) => {
      const weekKey = getWeekKey(session.startAt);

      if (!weeklyDataMap.has(weekKey)) {
        weeklyDataMap.set(weekKey, {
          loads: [],
          volumes: [],
          reps: [],
          e1rms: [],
          setsCount: 0,
        });
      }

      const weekData = weeklyDataMap.get(weekKey)!;
      const metrics = this.aggregateExerciseMetrics(
        session.exercises.flatMap((ex) => ex.sets),
      );

      weekData.loads.push(...metrics.loads);
      weekData.volumes.push(...metrics.volumes);
      weekData.reps.push(...metrics.reps);
      weekData.e1rms.push(...metrics.e1rms);
      weekData.setsCount += metrics.setsCount;
    });

    const weeks = Array.from(weeklyDataMap.entries())
      .map(([week, data]) => ({
        week,
        ...this.buildProgressionPoint(data),
      }))
      .sort((a, b) => a.week.localeCompare(b.week));

    const periodSummary = buildPeriodSummary(this.toPeriodSummaryPoints(weeks));

    return {
      granularity: 'week' as const,
      weeks,
      sessions: [],
      periodSummary,
    };
  }

  /** Get pinned exercises for a user */
  async getPinnedExercises(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { pinnedExerciseIds: true },
    });

    return user?.pinnedExerciseIds || [];
  }

  /** Pin an exercise for a user */
  async pinExercise(userId: string, exerciseId: string): Promise<void> {
    // Validate that exercise exists
    await this.validateExerciseExists(exerciseId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { pinnedExerciseIds: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const currentPinned = user.pinnedExerciseIds || [];
    const MAX_PINNED = 5;

    // Check if already pinned
    if (currentPinned.includes(exerciseId)) {
      throw new BadRequestException('Exercise is already pinned');
    }

    // Check limit
    if (currentPinned.length >= MAX_PINNED) {
      throw new BadRequestException(
        `Maximum of ${MAX_PINNED} pinned exercises allowed`,
      );
    }

    // Add to pinned list
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        pinnedExerciseIds: {
          set: [...currentPinned, exerciseId],
        },
      },
    });
  }

  /** Unpin an exercise for a user */
  async unpinExercise(userId: string, exerciseId: string): Promise<void> {
    // Validate that exercise exists
    await this.validateExerciseExists(exerciseId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { pinnedExerciseIds: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const currentPinned = user.pinnedExerciseIds || [];

    // Check if not pinned
    if (!currentPinned.includes(exerciseId)) {
      throw new BadRequestException('Exercise is not pinned');
    }

    // Remove from pinned list
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        pinnedExerciseIds: {
          set: currentPinned.filter((id) => id !== exerciseId),
        },
      },
    });
  }

  /** Validate that an exercise exists */
  private async validateExerciseExists(exerciseId: string): Promise<void> {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id: exerciseId },
      select: { id: true },
    });

    if (!exercise) {
      throw new BadRequestException('Exercise not found');
    }
  }

  /** Busca histórico de séries de um exercício específico */
  async getExerciseHistory(
    userId: string,
    exerciseId: string,
    limit: number = 5,
  ) {
    // Buscar últimas N sessões finalizadas que contêm o exercício
    const sessions = await this.prisma.workoutSession.findMany({
      where: {
        userId,
        endAt: { not: null }, // Apenas sessões finalizadas
        exercises: {
          some: {
            exerciseId,
          },
        },
      },
      include: {
        exercises: {
          where: {
            exerciseId,
          },
          include: {
            sets: {
              where: {
                completed: true, // Apenas séries completadas
              },
              orderBy: {
                setIndex: 'asc',
              },
              include: {
                intensityBlocks: {
                  orderBy: {
                    blockIndex: 'asc',
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        startAt: 'desc', // Mais recente primeiro
      },
      take: limit,
    });

    // Formatar resposta
    return sessions.map((session) => ({
      sessionId: session.id,
      sessionTitle: session.title,
      sessionDate: session.startAt.toISOString(),
      sets: session.exercises
        .flatMap((ex) => ex.sets)
        .map((set) => ({
          setIndex: set.setIndex,
          actualLoad: set.actualLoad,
          actualReps: set.actualReps,
          actualRir: set.actualRir,
          completed: set.completed,
          intensityType: set.intensityType,
          intensityBlocks: set.intensityBlocks.map((block) => ({
            blockIndex: block.blockIndex,
            reps: block.reps,
            restSeconds: block.restSeconds,
            load: block.load,
          })),
        })),
    }));
  }

  /** Exporta histórico completo de treinos finalizados para análise */
  async exportWorkoutHistory(
    userId: string,
    startDate: Date | null = null,
    endDate: Date | null = null,
  ) {
    // Construir filtros de data
    const dateFilters: { gte?: Date; lte?: Date } = {};
    if (startDate) {
      dateFilters.gte = startDate;
    }
    if (endDate) {
      dateFilters.lte = endDate;
    }

    // Buscar todas as sessões finalizadas do usuário
    const sessions = await this.prisma.workoutSession.findMany({
      where: {
        userId,
        endAt: { not: null }, // Apenas sessões finalizadas
        ...(Object.keys(dateFilters).length > 0 && { startAt: dateFilters }),
      },
      include: {
        exercises: {
          include: {
            exercise: true, // Para obter nome e grupo muscular
            sets: {
              include: {
                intensityBlocks: {
                  orderBy: {
                    blockIndex: 'asc',
                  },
                },
              },
              orderBy: {
                setIndex: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        startAt: 'desc', // Mais recente primeiro
      },
    });

    // Formatar resposta
    const formattedSessions = sessions.map((session) => ({
      id: session.id,
      title: session.title,
      startAt: session.startAt.toISOString(),
      endAt: session.endAt?.toISOString() || null,
      durationM: session.durationM,
      fatigue: session.fatigue,
      feeling: session.feeling,
      notes: session.notes,
      exercises: session.exercises.map((exercise) => ({
        exerciseName: exercise.exercise.name,
        muscleGroup: exercise.exercise.muscleGroup,
        order: exercise.order,
        notes: exercise.notes,
        sets: exercise.sets.map((set) => ({
          setIndex: set.setIndex,
          plannedLoad: set.plannedLoad,
          plannedReps: set.plannedReps,
          plannedRir: set.plannedRir,
          actualLoad: set.actualLoad,
          actualReps: set.actualReps,
          actualRir: set.actualRir,
          unit: set.unit,
          completed: set.completed,
          intensityType: set.intensityType,
          notes: set.notes,
          intensityBlocks: set.intensityBlocks.map((block) => ({
            blockIndex: block.blockIndex,
            reps: block.reps,
            restSeconds: block.restSeconds,
            load: block.load,
          })),
        })),
      })),
    }));

    return {
      sessions: formattedSessions,
      total: formattedSessions.length,
      exportedAt: new Date().toISOString(),
      filters: {
        startDate: startDate?.toISOString() || null,
        endDate: endDate?.toISOString() || null,
      },
    };
  }
}
