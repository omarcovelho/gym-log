import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AppConfigService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get password reset expiration time in hours (default: 24)
   */
  async getPasswordResetExpirationHours(): Promise<number> {
    const config = await this.prisma.appConfig.findUnique({
      where: { key: 'password_reset_expiration_hours' },
    });

    if (!config) {
      // Create default config if it doesn't exist
      const defaultHours = 24;
      await this.prisma.appConfig.create({
        data: {
          key: 'password_reset_expiration_hours',
          value: defaultHours.toString(),
        },
      });
      return defaultHours;
    }

    return parseInt(config.value, 10) || 24;
  }

  /**
   * Update password reset expiration time in hours (optional, for admin)
   */
  async updatePasswordResetExpirationHours(hours: number): Promise<void> {
    await this.prisma.appConfig.upsert({
      where: { key: 'password_reset_expiration_hours' },
      update: { value: hours.toString() },
      create: {
        key: 'password_reset_expiration_hours',
        value: hours.toString(),
      },
    });
  }
}

