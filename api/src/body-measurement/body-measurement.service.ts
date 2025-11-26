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
}

