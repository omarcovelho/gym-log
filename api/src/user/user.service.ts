import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateStatsDto } from './dto/update-stats.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async updateStats(userId: string, dto: UpdateStatsDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        height: dto.height,
        weight: dto.weight,
      },
      select: {
        id: true,
        email: true,
        name: true,
        height: true,
        weight: true,
        role: true,
      },
    });
  }

  async getStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        height: true,
        weight: true,
        role: true,
      },
    });
    return user;
  }

  async hasStats(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        height: true,
        weight: true,
      },
    });
    return user !== null && user.height !== null && user.weight !== null;
  }
}

