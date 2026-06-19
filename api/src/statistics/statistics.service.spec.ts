import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { PrismaService } from '../prisma/prisma.service';

describe('StatisticsService', () => {
  let service: StatisticsService;
  let prisma: {
    workoutSession: { findMany: jest.Mock };
    exercise: { findUnique: jest.Mock };
  };

  const userId = 'user-1';
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-01-31T23:59:59.999Z');

  const chestExercise = {
    id: 'ex-chest',
    name: 'Bench Press',
    muscleGroup: 'CHEST',
  };

  function makeSession(id: string, startAt: Date, load: number, reps: number) {
    return {
      id,
      startAt,
      endAt: new Date(startAt.getTime() + 3600000),
      exercises: [
        {
          exerciseId: 'ex-chest',
          exercise: chestExercise,
          sets: [
            {
              completed: true,
              actualLoad: load,
              actualReps: reps,
              intensityType: 'NONE',
              intensityBlocks: [],
            },
          ],
        },
      ],
    };
  }

  beforeEach(async () => {
    prisma = {
      workoutSession: { findMany: jest.fn().mockResolvedValue([]) },
      exercise: {
        findUnique: jest.fn().mockResolvedValue(chestExercise),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatisticsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<StatisticsService>(StatisticsService);
  });

  describe('getEvolutionStats', () => {
    it('queries sessions with date and tag filters in Prisma where', async () => {
      await service.getEvolutionStats(userId, startDate, endDate, undefined, [
        'tag-base',
      ]);

      expect(prisma.workoutSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId,
            endAt: { not: null },
            startAt: { gte: expect.any(Date), lte: expect.any(Date) },
            tags: { some: { tagId: { in: ['tag-base'] } } },
          }),
        }),
      );
    });

    it('returns sessionStats with one point per session when granularity is session', async () => {
      prisma.workoutSession.findMany.mockResolvedValue([
        makeSession('s1', new Date('2024-01-08T10:00:00'), 80, 8),
        makeSession('s2', new Date('2024-01-15T10:00:00'), 85, 8),
      ]);

      const result = await service.getEvolutionStats(
        userId,
        startDate,
        endDate,
        undefined,
        undefined,
        'session',
      );

      expect(result.granularity).toBe('session');
      expect(result.sessionStats).toHaveLength(2);
      expect(result.sessionStats[0].sessionId).toBe('s1');
      expect(result.sessionStats[0].volume).toBe(640);
      expect(result.sessionStats[1].sessionId).toBe('s2');
      expect(result.weeklyStats).toEqual([]);
    });

    it('returns periodSummary for session granularity', async () => {
      prisma.workoutSession.findMany.mockResolvedValue([
        makeSession('s1', new Date('2024-01-08T10:00:00'), 80, 8),
        makeSession('s2', new Date('2024-01-15T10:00:00'), 85, 8),
      ]);

      const result = await service.getEvolutionStats(
        userId,
        startDate,
        endDate,
        undefined,
        undefined,
        'session',
      );

      expect(result.periodSummary.pointCount).toBe(2);
      expect(result.periodSummary.latest?.volume).toBe(85 * 8);
      expect(result.periodSummary.trend?.volumeStart).toBe(80 * 8);
      expect(result.periodSummary.trend?.volumeEnd).toBe(85 * 8);
    });

    it('merges same-week sessions when granularity is week', async () => {
      prisma.workoutSession.findMany.mockResolvedValue([
        makeSession('s1', new Date('2024-01-08T10:00:00'), 80, 8),
        makeSession('s2', new Date('2024-01-09T10:00:00'), 85, 8),
      ]);

      const result = await service.getEvolutionStats(
        userId,
        startDate,
        endDate,
        undefined,
        undefined,
        'week',
      );

      expect(result.granularity).toBe('week');
      expect(result.weeklyStats).toHaveLength(1);
      expect(result.weeklyStats[0].volume).toBe(80 * 8 + 85 * 8);
    });
  });

  describe('getExerciseProgression', () => {
    it('queries with exerciseId and tag filters in Prisma where', async () => {
      await service.getExerciseProgression(
        userId,
        'ex-chest',
        startDate,
        endDate,
        ['tag-base'],
        'week',
      );

      expect(prisma.workoutSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            exercises: { some: { exerciseId: 'ex-chest' } },
            tags: { some: { tagId: { in: ['tag-base'] } } },
          }),
        }),
      );
    });

    it('returns periodSummary with latest and trend for multiple sessions', async () => {
      prisma.workoutSession.findMany.mockResolvedValue([
        makeSession('s1', new Date('2024-01-08T10:00:00'), 80, 8),
        makeSession('s2', new Date('2024-01-15T10:00:00'), 90, 5),
      ]);

      const result = await service.getExerciseProgression(
        userId,
        'ex-chest',
        startDate,
        endDate,
        undefined,
        'session',
      );

      expect(result.periodSummary.pointCount).toBe(2);
      expect(result.periodSummary.latest?.avgLoad).toBe(90);
      expect(result.periodSummary.deltaVsPrevious?.avgLoad).toBe(10);
      expect(result.periodSummary.trend?.avgLoadStart).toBe(80);
      expect(result.periodSummary.trend?.avgLoadEnd).toBe(90);
    });

    it('throws when exercise not found', async () => {
      prisma.exercise.findUnique.mockResolvedValue(null);

      await expect(
        service.getExerciseProgression(userId, 'missing', startDate, endDate),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
