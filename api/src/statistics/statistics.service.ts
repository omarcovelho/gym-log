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
}

