import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

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

  /** Busca estatísticas de evolução (PRs e volume semanal) */
  async getEvolutionStats(
    userId: string,
    startDate?: Date | null,
    endDate?: Date | null,
    weeks?: number, // Deprecated: manter apenas para compatibilidade
  ) {
    const now = new Date();
    
    // Se startDate e endDate não forem fornecidos, usar default de 4 semanas
    let dateStart: Date | null = null;
    let dateEnd: Date | null = null;
    
    if (startDate && endDate) {
      dateStart = new Date(startDate);
      dateStart.setHours(0, 0, 0, 0);
      dateEnd = new Date(endDate);
      dateEnd.setHours(23, 59, 59, 999);
    } else if (weeks) {
      // Compatibilidade: usar weeks se fornecido
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const startOfCurrentWeek = new Date(today);
      startOfCurrentWeek.setDate(diff);
      startOfCurrentWeek.setHours(0, 0, 0, 0);
      dateStart = new Date(startOfCurrentWeek.getTime() - (weeks - 1) * 7 * 24 * 60 * 60 * 1000);
      dateStart.setHours(0, 0, 0, 0);
      dateEnd = new Date(now);
      dateEnd.setHours(23, 59, 59, 999);
    } else {
      // Default: 4 semanas
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const startOfCurrentWeek = new Date(today);
      startOfCurrentWeek.setDate(diff);
      startOfCurrentWeek.setHours(0, 0, 0, 0);
      dateStart = new Date(startOfCurrentWeek.getTime() - 3 * 7 * 24 * 60 * 60 * 1000);
      dateStart.setHours(0, 0, 0, 0);
      dateEnd = new Date(now);
      dateEnd.setHours(23, 59, 59, 999);
    }

    // Buscar todos os treinos finalizados do usuário
    const allFinishedSessions = await this.prisma.workoutSession.findMany({
      where: {
        userId,
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

    allFinishedSessions.forEach((session) => {
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

      for (const session of allFinishedSessions) {
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

    // Filtrar PRs pelo range de data
    const recentPRs = Array.from(exercisePRs.entries())
      .filter(([, pr]) => {
        if (dateStart && dateEnd) {
          return pr.date >= dateStart && pr.date <= dateEnd;
        }
        // Se ambos forem null, mostrar todos os PRs
        return true;
      })
      .map(([exerciseName, pr]) => ({
        exerciseName,
        value: pr.maxLoad,
        previousValue: pr.previousMaxLoad,
        date: pr.date,
        workoutId: pr.workoutId,
        unit: 'kg',
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime()); // Mais recentes primeiro

    // Calcular volume semanal
    const weeklyStatsMap = new Map<
      string,
      {
        volume: number;
        sets: number;
        byMuscleGroup: Map<string, { volume: number; sets: number }>;
      }
    >();

    // Função para obter chave da semana (formato: "2024-11-24" - data da segunda-feira)
    const getWeekKey = (date: Date): string => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const dayOfWeek = d.getDay();
      // Ajustar para segunda-feira (0 = domingo, 1 = segunda, etc.)
      const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(d);
      monday.setDate(diff);
      
      // Retornar data da segunda-feira no formato YYYY-MM-DD
      const year = monday.getFullYear();
      const month = String(monday.getMonth() + 1).padStart(2, '0');
      const day = String(monday.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    };

    // Processar treinos dentro do range de data
    const sessionsInRange = allFinishedSessions.filter((session) => {
      const sessionDate = new Date(session.startAt);
      if (dateStart && dateEnd) {
        return sessionDate.getTime() >= dateStart.getTime() && sessionDate.getTime() <= dateEnd.getTime();
      }
      // Se ambos forem null, incluir todos os treinos
      return true;
    });

    sessionsInRange.forEach((session) => {
      const weekKey = getWeekKey(session.startAt);

      if (!weeklyStatsMap.has(weekKey)) {
        weeklyStatsMap.set(weekKey, {
          volume: 0,
          sets: 0,
          byMuscleGroup: new Map(),
        });
      }

      const weekStats = weeklyStatsMap.get(weekKey)!;

      session.exercises.forEach((ex) => {
        // Filtrar exercícios com muscleGroup null ou OTHER
        if (!ex.exercise.muscleGroup || ex.exercise.muscleGroup === 'OTHER') {
          return;
        }

        const muscleGroup = ex.exercise.muscleGroup;

        if (!weekStats.byMuscleGroup.has(muscleGroup)) {
          weekStats.byMuscleGroup.set(muscleGroup, { volume: 0, sets: 0 });
        }

        const muscleGroupStats = weekStats.byMuscleGroup.get(muscleGroup)!;

        ex.sets.forEach((set) => {
          // Contar todas as séries
          weekStats.sets++;
          muscleGroupStats.sets++;

          // Calcular volume apenas para sets com actualLoad e actualReps preenchidos
          if (set.actualLoad != null && set.actualReps != null) {
            const volume = set.actualLoad * set.actualReps;
            weekStats.volume += volume;
            muscleGroupStats.volume += volume;
          }
        });
      });
    });

    // Converter para array e ordenar por semana
    const weeklyStats = Array.from(weeklyStatsMap.entries())
      .map(([week, stats]) => ({
        week,
        volume: stats.volume,
        sets: stats.sets,
        byMuscleGroup: Object.fromEntries(
          Array.from(stats.byMuscleGroup.entries()).map(([mg, data]) => [
            mg,
            { volume: data.volume, sets: data.sets },
          ])
        ),
      }))
      .sort((a, b) => a.week.localeCompare(b.week));

    return {
      recentPRs,
      weeklyStats,
    };
  }

  /** Busca progressão de um exercício específico */
  async getExerciseProgression(
    userId: string,
    exerciseId: string,
    startDate?: Date | null,
    endDate?: Date | null,
  ) {
    // Validar que o exercício existe
    const exercise = await this.prisma.exercise.findUnique({
      where: { id: exerciseId },
    });

    if (!exercise) {
      throw new BadRequestException('Exercise not found.');
    }
    // Normalizar datas
    let dateStart: Date | null = null;
    let dateEnd: Date | null = null;

    if (startDate && endDate) {
      dateStart = new Date(startDate);
      dateStart.setHours(0, 0, 0, 0);
      dateEnd = new Date(endDate);
      dateEnd.setHours(23, 59, 59, 999);
    }

    // Buscar todos os treinos finalizados do exercício
    const allFinishedSessions = await this.prisma.workoutSession.findMany({
      where: {
        userId,
        endAt: { not: null },
        exercises: {
          some: {
            exerciseId,
          },
        },
        ...(dateStart && dateEnd
          ? {
              startAt: {
                gte: dateStart,
                lte: dateEnd,
              },
            }
          : {}),
      },
      include: {
        exercises: {
          where: {
            exerciseId,
          },
          include: {
            sets: true,
            exercise: true,
          },
        },
      },
      orderBy: { startAt: 'asc' },
    });

    // Função para obter chave da semana (formato: "2024-11-24" - data da segunda-feira)
    const getWeekKey = (date: Date): string => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const dayOfWeek = d.getDay();
      const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(d);
      monday.setDate(diff);

      const year = monday.getFullYear();
      const month = String(monday.getMonth() + 1).padStart(2, '0');
      const day = String(monday.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    };

    // Agrupar por semana
    const weeklyDataMap = new Map<
      string,
      {
        loads: number[];
        volumes: number[];
        reps: number[];
        setsCount: number;
      }
    >();

    allFinishedSessions.forEach((session) => {
      const weekKey = getWeekKey(session.startAt);

      if (!weeklyDataMap.has(weekKey)) {
        weeklyDataMap.set(weekKey, {
          loads: [],
          volumes: [],
          reps: [],
          setsCount: 0,
        });
      }

      const weekData = weeklyDataMap.get(weekKey)!;

      session.exercises.forEach((ex) => {
        ex.sets.forEach((set) => {
          if (set.completed && set.actualLoad != null && set.actualReps != null) {
            weekData.loads.push(set.actualLoad);
            weekData.volumes.push(set.actualLoad * set.actualReps);
            weekData.reps.push(set.actualReps);
            weekData.setsCount++;
          }
        });
      });
    });

    // Calcular estatísticas por semana
    const weeks = Array.from(weeklyDataMap.entries())
      .map(([week, data]) => ({
        week,
        avgLoad: data.loads.length > 0 ? data.loads.reduce((a, b) => a + b, 0) / data.loads.length : 0,
        totalVolume: data.volumes.reduce((a, b) => a + b, 0),
        avgReps: data.reps.length > 0 ? data.reps.reduce((a, b) => a + b, 0) / data.reps.length : 0,
        setsCount: data.setsCount,
      }))
      .sort((a, b) => a.week.localeCompare(b.week));

    // Encontrar semana atual e anterior
    const currentWeek = weeks.length > 0 ? weeks[weeks.length - 1] : null;
    const previousWeek = weeks.length > 1 ? weeks[weeks.length - 2] : null;

    // Calcular médias das últimas 4 semanas
    const last4Weeks = weeks.slice(-4);
    const avgLast4Weeks =
      last4Weeks.length > 0
        ? {
            avgLoad:
              last4Weeks.reduce((sum, w) => sum + w.avgLoad, 0) / last4Weeks.length,
            totalVolume: last4Weeks.reduce((sum, w) => sum + w.totalVolume, 0),
            avgReps:
              last4Weeks.reduce((sum, w) => sum + w.avgReps, 0) / last4Weeks.length,
          }
        : null;

    // Calcular médias das 4 semanas anteriores
    const previous4Weeks = weeks.length > 4 ? weeks.slice(-8, -4) : [];
    const avgPrevious4Weeks =
      previous4Weeks.length > 0
        ? {
            avgLoad:
              previous4Weeks.reduce((sum, w) => sum + w.avgLoad, 0) / previous4Weeks.length,
            totalVolume: previous4Weeks.reduce((sum, w) => sum + w.totalVolume, 0),
            avgReps:
              previous4Weeks.reduce((sum, w) => sum + w.avgReps, 0) / previous4Weeks.length,
          }
        : null;

    // Determinar tendência
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (avgLast4Weeks && avgPrevious4Weeks) {
      const loadDiff = avgLast4Weeks.avgLoad - avgPrevious4Weeks.avgLoad;
      const volumeDiff = avgLast4Weeks.totalVolume - avgPrevious4Weeks.totalVolume;
      if (loadDiff > 0 || volumeDiff > 0) {
        trend = 'up';
      } else if (loadDiff < 0 || volumeDiff < 0) {
        trend = 'down';
      }
    } else if (currentWeek && previousWeek) {
      const loadDiff = currentWeek.avgLoad - previousWeek.avgLoad;
      const volumeDiff = currentWeek.totalVolume - previousWeek.totalVolume;
      if (loadDiff > 0 || volumeDiff > 0) {
        trend = 'up';
      } else if (loadDiff < 0 || volumeDiff < 0) {
        trend = 'down';
      }
    }

    return {
      weeks,
      currentWeek,
      previousWeek,
      avgLast4Weeks,
      avgPrevious4Weeks,
      trend,
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
      throw new BadRequestException(`Maximum of ${MAX_PINNED} pinned exercises allowed`);
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
}

