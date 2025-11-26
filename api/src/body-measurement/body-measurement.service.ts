import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBodyMeasurementDto } from './dto/create-body-measurement.dto';
import { UpdateBodyMeasurementDto } from './dto/update-body-measurement.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class BodyMeasurementService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateBodyMeasurementDto) {
    const date = dto.date ? new Date(dto.date) : new Date();
    // Normalizar data para início do dia (00:00:00) para comparações
    date.setHours(0, 0, 0, 0);

    return this.prisma.bodyMeasurement.create({
      data: {
        userId,
        weight: dto.weight,
        waist: dto.waist,
        arm: dto.arm,
        notes: dto.notes,
        date,
      },
    });
  }

  async findAll(userId: string, pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.bodyMeasurement.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.bodyMeasurement.count({ where: { userId } }),
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
    const measurement = await this.prisma.bodyMeasurement.findUnique({
      where: { id },
    });

    if (!measurement) {
      throw new NotFoundException('Measurement not found');
    }

    if (measurement.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return measurement;
  }

  async update(userId: string, id: string, dto: UpdateBodyMeasurementDto) {
    // Verificar se existe e pertence ao usuário
    const existing = await this.findById(userId, id);

    const updateData: any = {};
    if (dto.weight !== undefined) updateData.weight = dto.weight;
    if (dto.waist !== undefined) updateData.waist = dto.waist;
    if (dto.arm !== undefined) updateData.arm = dto.arm;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.date !== undefined) {
      const date = new Date(dto.date);
      date.setHours(0, 0, 0, 0);
      updateData.date = date;
    }

    return this.prisma.bodyMeasurement.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(userId: string, id: string) {
    // Verificar se existe e pertence ao usuário
    await this.findById(userId, id);

    return this.prisma.bodyMeasurement.delete({
      where: { id },
    });
  }

  async getLatest(userId: string) {
    return this.prisma.bodyMeasurement.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }

  async hasMeasurementToday(userId: string): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const count = await this.prisma.bodyMeasurement.count({
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

  async getMeasurementsStats(userId: string, weeks: number = 8) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    // Calcular data de início (N semanas atrás)
    const weeksAgo = new Date(now);
    weeksAgo.setDate(weeksAgo.getDate() - (weeks * 7));
    weeksAgo.setHours(0, 0, 0, 0);

    // Buscar todas as medidas do usuário no período
    const allMeasurements = await this.prisma.bodyMeasurement.findMany({
      where: {
        userId,
        date: {
          gte: weeksAgo,
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

    // Agrupar medidas por semana (apenas semanas completas)
    const weeklyDataMap = new Map<
      string,
      {
        weight: number[];
        waist: number[];
        arm: number[];
        weekStart: string;
      }
    >();

    allMeasurements.forEach((measurement) => {
      const measurementDate = new Date(measurement.date);
      // Apenas incluir se for de uma semana completa (antes do início da semana atual)
      if (measurementDate <= lastCompleteWeekEnd) {
        const weekKey = getWeekKey(measurementDate);
        
        if (!weeklyDataMap.has(weekKey)) {
          weeklyDataMap.set(weekKey, {
            weight: [],
            waist: [],
            arm: [],
            weekStart: weekKey,
          });
        }

        const weekData = weeklyDataMap.get(weekKey)!;
        weekData.weight.push(measurement.weight);
        if (measurement.waist !== null) {
          weekData.waist.push(measurement.waist);
        }
        if (measurement.arm !== null) {
          weekData.arm.push(measurement.arm);
        }
      }
    });

    // Calcular médias semanais
    const calculateAverage = (values: number[]): number | null => {
      if (values.length === 0) return null;
      const sum = values.reduce((acc, val) => acc + val, 0);
      return sum / values.length;
    };

    const weeklyData = {
      weight: [] as Array<{ week: string; date: string; value: number }>,
      waist: [] as Array<{ week: string; date: string; value: number }>,
      arm: [] as Array<{ week: string; date: string; value: number }>,
    };

    // Ordenar semanas por data
    const sortedWeeks = Array.from(weeklyDataMap.entries()).sort((a, b) => 
      a[0].localeCompare(b[0])
    );

    sortedWeeks.forEach(([weekKey, weekData]) => {
      const weightAvg = calculateAverage(weekData.weight);
      const waistAvg = calculateAverage(weekData.waist);
      const armAvg = calculateAverage(weekData.arm);

      if (weightAvg !== null) {
        weeklyData.weight.push({
          week: weekKey,
          date: weekKey,
          value: Math.round(weightAvg * 10) / 10, // 1 decimal
        });
      }

      if (waistAvg !== null) {
        weeklyData.waist.push({
          week: weekKey,
          date: weekKey,
          value: Math.round(waistAvg * 10) / 10,
        });
      }

      if (armAvg !== null) {
        weeklyData.arm.push({
          week: weekKey,
          date: weekKey,
          value: Math.round(armAvg * 10) / 10,
        });
      }
    });

    // Pegar valor atual (última medida, independente da semana)
    const currentMeasurement = allMeasurements[0] || null;
    const current = {
      weight: currentMeasurement?.weight || null,
      waist: currentMeasurement?.waist || null,
      arm: currentMeasurement?.arm || null,
      date: currentMeasurement?.date || null,
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

    const trends = {
      weight: calculateTrend(weeklyData.weight),
      waist: calculateTrend(weeklyData.waist),
      arm: calculateTrend(weeklyData.arm),
    };

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

    const averages = {
      weight: calculateOverallAverage(weeklyData.weight),
      waist: calculateOverallAverage(weeklyData.waist),
      arm: calculateOverallAverage(weeklyData.arm),
    };

    return {
      weeklyData,
      trends,
      current,
      averages,
    };
  }
}

