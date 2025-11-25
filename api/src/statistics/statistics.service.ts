import { Injectable } from '@nestjs/common';
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
  async getEvolutionStats(userId: string, weeks: number = 4) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Calcular o início da semana atual (segunda-feira)
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const startOfCurrentWeek = new Date(today);
    startOfCurrentWeek.setDate(diff);
    startOfCurrentWeek.setHours(0, 0, 0, 0);
    
    // Calcular o início da semana que está (weeks - 1) semanas atrás
    // Isso garante que incluímos a semana atual + (weeks - 1) semanas anteriores
    const weeksAgo = new Date(startOfCurrentWeek.getTime() - (weeks - 1) * 7 * 24 * 60 * 60 * 1000);
    weeksAgo.setHours(0, 0, 0, 0);

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

    // Filtrar apenas PRs dos últimos 30 dias
    const recentPRs = Array.from(exercisePRs.entries())
      .filter(([, pr]) => pr.date >= thirtyDaysAgo)
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

    // Processar treinos das últimas N semanas
    // Incluir todos os treinos desde weeksAgo até agora (incluindo hoje)
    const sessionsInRange = allFinishedSessions.filter((session) => {
      const sessionDate = new Date(session.startAt);
      // Comparar timestamps para garantir inclusão de treinos de hoje
      // Não normalizar sessionDate para manter a hora exata, mas comparar com weeksAgo normalizado
      return sessionDate.getTime() >= weeksAgo.getTime();
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
}

