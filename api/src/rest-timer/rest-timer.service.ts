import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRestTimerDto } from './dto/create-rest-timer.dto';
import { UpdateRestTimerDto } from './dto/update-rest-timer.dto';

@Injectable()
export class RestTimerService {
  // Timers padrão hardcoded (apenas seconds, sem name)
  private readonly DEFAULT_TIMERS = [
    { seconds: 30, isDefault: true },
    { seconds: 60, isDefault: true },
    { seconds: 90, isDefault: true },
    { seconds: 120, isDefault: true },
    { seconds: 180, isDefault: true },
    { seconds: 300, isDefault: true },
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
      seconds: timer.seconds,
      isDefault: timer.isDefault,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    return [...defaultTimersWithIds, ...customTimers];
  }

  async create(userId: string, createDto: CreateRestTimerDto) {
    // Verificar se já existe timer padrão com mesmo seconds
    const defaultTimerExists = this.DEFAULT_TIMERS.some(
      (timer) => timer.seconds === createDto.seconds,
    );

    if (defaultTimerExists) {
      throw new ConflictException('A timer with this value already exists');
    }

    // Verificar se já existe timer customizado com mesmo seconds
    const existingTimer = await this.prisma.restTimer.findFirst({
      where: {
        userId,
        seconds: createDto.seconds,
      },
    });

    if (existingTimer) {
      throw new ConflictException('A timer with this value already exists');
    }

    return this.prisma.restTimer.create({
      data: {
        seconds: createDto.seconds,
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

    // Se estiver atualizando seconds, verificar duplicatas
    if (updateDto.seconds !== undefined) {
      // Verificar se já existe timer padrão com mesmo seconds
      const defaultTimerExists = this.DEFAULT_TIMERS.some(
        (t) => t.seconds === updateDto.seconds,
      );

      if (defaultTimerExists) {
        throw new ConflictException('A timer with this value already exists');
      }

      // Verificar se já existe outro timer customizado com mesmo seconds
      const existingTimer = await this.prisma.restTimer.findFirst({
        where: {
          userId,
          seconds: updateDto.seconds,
          id: { not: id }, // Excluir o timer atual
        },
      });

      if (existingTimer) {
        throw new ConflictException('A timer with this value already exists');
      }
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

