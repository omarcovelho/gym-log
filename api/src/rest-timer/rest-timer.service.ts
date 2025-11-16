import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRestTimerDto } from './dto/create-rest-timer.dto';
import { UpdateRestTimerDto } from './dto/update-rest-timer.dto';

@Injectable()
export class RestTimerService {
  // Timers padrão hardcoded
  private readonly DEFAULT_TIMERS = [
    { name: '30s', seconds: 30, isDefault: true },
    { name: '1min', seconds: 60, isDefault: true },
    { name: '1:30', seconds: 90, isDefault: true },
    { name: '2min', seconds: 120, isDefault: true },
    { name: '3min', seconds: 180, isDefault: true },
    { name: '5min', seconds: 300, isDefault: true },
  ];

  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    // Buscar timers customizados do usuário
    const customTimers = await this.prisma.restTimer.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    // Combinar com timers padrão (adicionar IDs temporários para compatibilidade)
    const defaultTimersWithIds = this.DEFAULT_TIMERS.map((timer, index) => ({
      id: `default-${index}`,
      userId,
      name: timer.name,
      seconds: timer.seconds,
      isDefault: timer.isDefault,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    return [...defaultTimersWithIds, ...customTimers];
  }

  async create(userId: string, createDto: CreateRestTimerDto) {
    return this.prisma.restTimer.create({
      data: {
        ...createDto,
        userId,
        isDefault: false,
      },
    });
  }

  async update(id: string, userId: string, updateDto: UpdateRestTimerDto) {
    const timer = await this.prisma.restTimer.findUnique({
      where: { id },
    });

    if (!timer) {
      throw new NotFoundException('Timer not found');
    }

    // Timers padrão não podem ser editados (mas não existem no banco, então isso nunca acontecerá)
    if (timer.isDefault) {
      throw new ForbiddenException('Default timers cannot be modified');
    }

    // Verificar ownership
    if (timer.userId !== userId) {
      throw new ForbiddenException('You can only edit your own timers');
    }

    return this.prisma.restTimer.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string, userId: string) {
    const timer = await this.prisma.restTimer.findUnique({
      where: { id },
    });

    if (!timer) {
      throw new NotFoundException('Timer not found');
    }

    // Timers padrão não podem ser deletados
    if (timer.isDefault) {
      throw new ForbiddenException('Default timers cannot be deleted');
    }

    // Verificar ownership
    if (timer.userId !== userId) {
      throw new ForbiddenException('You can only delete your own timers');
    }

    return this.prisma.restTimer.delete({
      where: { id },
    });
  }
}

