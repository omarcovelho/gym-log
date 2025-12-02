import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSleepDto } from './dto/create-sleep.dto';
import { UpdateSleepDto } from './dto/update-sleep.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class SleepService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateSleepDto) {
    const date = dto.date ? new Date(dto.date) : new Date();
    // Normalizar data para início do dia (00:00:00) para comparações
    date.setHours(0, 0, 0, 0);

    const sleepBedtime = dto.sleepBedtime ? new Date(dto.sleepBedtime) : null;
    const sleepWakeTime = dto.sleepWakeTime ? new Date(dto.sleepWakeTime) : null;

    return this.prisma.sleep.create({
      data: {
        userId,
        sleepHours: dto.sleepHours,
        sleepQuality: dto.sleepQuality,
        sleepBedtime,
        sleepWakeTime,
        notes: dto.notes,
        date,
      },
    });
  }

  async findAll(userId: string, pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.sleep.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.sleep.count({ where: { userId } }),
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

  async findById(userId: string, id: string) {
    const sleep = await this.prisma.sleep.findUnique({
      where: { id },
    });

    if (!sleep) {
      throw new NotFoundException('Sleep record not found');
    }

    if (sleep.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return sleep;
  }

  async update(userId: string, id: string, dto: UpdateSleepDto) {
    // Verificar se existe e pertence ao usuário
    await this.findById(userId, id);

    const updateData: any = {};
    if (dto.sleepHours !== undefined) updateData.sleepHours = dto.sleepHours;
    if (dto.sleepQuality !== undefined) updateData.sleepQuality = dto.sleepQuality;
    if (dto.sleepBedtime !== undefined) {
      updateData.sleepBedtime = dto.sleepBedtime ? new Date(dto.sleepBedtime) : null;
    }
    if (dto.sleepWakeTime !== undefined) {
      updateData.sleepWakeTime = dto.sleepWakeTime ? new Date(dto.sleepWakeTime) : null;
    }
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.date !== undefined) {
      const date = new Date(dto.date);
      date.setHours(0, 0, 0, 0);
      updateData.date = date;
    }

    return this.prisma.sleep.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(userId: string, id: string) {
    // Verificar se existe e pertence ao usuário
    await this.findById(userId, id);

    return this.prisma.sleep.delete({
      where: { id },
    });
  }

  async getLatest(userId: string) {
    return this.prisma.sleep.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }

  async hasSleepToday(userId: string): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const count = await this.prisma.sleep.count({
      where: {
        userId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    return count > 0;
  }

  async getSleepStats(
    userId: string,
    weeks?: number,
    startDate?: Date | null,
    endDate?: Date | null,
  ) {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    
    // Determinar data de início e fim
    let dateStart: Date;
    let dateEnd: Date;

    if (startDate && endDate) {
      // Usar datas fornecidas
      dateStart = new Date(startDate);
      dateStart.setHours(0, 0, 0, 0);
      dateEnd = new Date(endDate);
      dateEnd.setHours(23, 59, 59, 999);
    } else if (weeks) {
      // Calcular baseado em semanas (comportamento padrão)
      dateEnd = new Date(now);
      dateEnd.setHours(23, 59, 59, 999);
      dateStart = new Date(now);
      dateStart.setDate(dateStart.getDate() - (weeks * 7));
      dateStart.setHours(0, 0, 0, 0);
    } else {
      // Default: 8 semanas
      dateEnd = new Date(now);
      dateEnd.setHours(23, 59, 59, 999);
      dateStart = new Date(now);
      dateStart.setDate(dateStart.getDate() - (8 * 7));
      dateStart.setHours(0, 0, 0, 0);
    }

    // Buscar todas as medidas do usuário no período
    const allSleeps = await this.prisma.sleep.findMany({
      where: {
        userId,
        date: {
          gte: dateStart,
          lte: dateEnd,
        },
      },
      orderBy: { date: 'desc' },
    });

    // Função para obter chave da semana (formato: "2024-11-24" - data da segunda-feira)
    const getWeekKey = (date: Date): string => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const dayOfWeek = d.getDay();
      // Ajustar para segunda-feira (0 = domingo, 1 = segunda, etc.)
      const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(d);
      monday.setDate(diff);
      
      const year = monday.getFullYear();
      const month = String(monday.getMonth() + 1).padStart(2, '0');
      const day = String(monday.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    };

    // Identificar última semana completa (não incluir semana atual)
    const todayWeekKey = getWeekKey(now);
    const lastCompleteWeekEnd = new Date(now);
    const dayOfWeek = lastCompleteWeekEnd.getDay();
    // Se hoje não é domingo, voltar para o domingo da semana passada
    if (dayOfWeek !== 0) {
      lastCompleteWeekEnd.setDate(lastCompleteWeekEnd.getDate() - dayOfWeek);
    }
    lastCompleteWeekEnd.setDate(lastCompleteWeekEnd.getDate() - 1); // Domingo da semana passada
    lastCompleteWeekEnd.setHours(23, 59, 59, 999);

    // Agrupar por semana (apenas semanas completas)
    const weeklyDataMap = new Map<
      string,
      {
        sleepHours: number[];
        weekStart: string;
      }
    >();

    allSleeps.forEach((sleep) => {
      const sleepDate = new Date(sleep.date);
      // Apenas incluir se for de uma semana completa (antes do início da semana atual)
      if (sleepDate <= lastCompleteWeekEnd) {
        const weekKey = getWeekKey(sleepDate);
        
        if (!weeklyDataMap.has(weekKey)) {
          weeklyDataMap.set(weekKey, {
            sleepHours: [],
            weekStart: weekKey,
          });
        }

        const weekData = weeklyDataMap.get(weekKey)!;
        weekData.sleepHours.push(sleep.sleepHours);
      }
    });

    // Calcular médias semanais
    const calculateAverage = (values: number[]): number | null => {
      if (values.length === 0) return null;
      const sum = values.reduce((acc, val) => acc + val, 0);
      return sum / values.length;
    };

    const weeklyData = [] as Array<{ week: string; date: string; value: number }>;

    // Ordenar semanas por data
    const sortedWeeks = Array.from(weeklyDataMap.entries()).sort((a, b) => 
      a[0].localeCompare(b[0])
    );

    sortedWeeks.forEach(([weekKey, weekData]) => {
      const avgHours = calculateAverage(weekData.sleepHours);

      if (avgHours !== null) {
        weeklyData.push({
          week: weekKey,
          date: weekKey,
          value: Math.round(avgHours * 10) / 10, // 1 decimal
        });
      }
    });

    // Pegar valor atual (última medida, independente da semana)
    const currentSleep = allSleeps[0] || null;
    const current = {
      sleepHours: currentSleep?.sleepHours || null,
      date: currentSleep?.date || null,
    };

    // Calcular tendências (comparar últimas 2 semanas completas)
    const calculateTrend = (
      weeklyValues: Array<{ week: string; date: string; value: number }>,
    ) => {
      if (weeklyValues.length < 2) {
        return {
          change: 0,
          changePercent: 0,
          direction: 'stable' as const,
        };
      }

      const lastWeek = weeklyValues[weeklyValues.length - 1];
      const previousWeek = weeklyValues[weeklyValues.length - 2];

      const change = lastWeek.value - previousWeek.value;
      const changePercent = (change / previousWeek.value) * 100;
      const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';

      return {
        change: Math.round(change * 10) / 10,
        changePercent: Math.round(changePercent * 10) / 10,
        direction,
      };
    };

    const trend = calculateTrend(weeklyData);

    // Calcular média geral das semanas anteriores (excluindo a última semana completa)
    const calculateOverallAverage = (
      weeklyValues: Array<{ week: string; date: string; value: number }>,
    ): number | null => {
      if (weeklyValues.length === 0) return null;
      // Excluir a última semana (mais recente) para comparar com histórico
      const weeksForAverage = weeklyValues.slice(0, -1);
      if (weeksForAverage.length === 0) return null;
      
      const sum = weeksForAverage.reduce((acc, week) => acc + week.value, 0);
      return Math.round((sum / weeksForAverage.length) * 10) / 10;
    };

    const average = calculateOverallAverage(weeklyData);

    return {
      weeklyData,
      trend,
      current,
      average,
    };
  }
}

