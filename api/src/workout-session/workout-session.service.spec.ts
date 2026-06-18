import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { WorkoutSessionService } from './workout-session.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { WorkoutTagService } from 'src/workout-tag/workout-tag.service';

describe('WorkoutSessionService', () => {
  let service: WorkoutSessionService;
  let prisma: {
    workoutSession: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
      delete: jest.Mock;
    };
    workoutTemplate: { findUnique: jest.Mock };
    sessionExercise: Record<string, jest.Mock>;
    sessionSet: Record<string, jest.Mock>;
    sessionSetIntensityBlock: Record<string, jest.Mock>;
  };
  let tagService: {
    syncSessionTags: jest.Mock;
    mapSessionTags: jest.Mock;
  };

  const userId = 'user-1';
  const sessionId = 'session-1';

  const sessionWithTags = {
    id: sessionId,
    userId,
    title: 'Workout',
    startAt: new Date('2025-01-01T10:00:00Z'),
    endAt: null,
    exercises: [],
    tags: [{ tag: { id: 'tag-1', name: 'Push' } }],
  };

  beforeEach(async () => {
    prisma = {
      workoutSession: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        delete: jest.fn(),
      },
      workoutTemplate: { findUnique: jest.fn() },
      sessionExercise: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      sessionSet: {
        findUnique: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      sessionSetIntensityBlock: {
        findMany: jest.fn(),
        deleteMany: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
    };

    tagService = {
      syncSessionTags: jest
        .fn()
        .mockResolvedValue([{ id: 'tag-1', name: 'Push' }]),
      mapSessionTags: jest.fn((tags) =>
        tags.map((row: { tag: { id: string; name: string } }) => ({
          id: row.tag.id,
          name: row.tag.name,
        })),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkoutSessionService,
        { provide: PrismaService, useValue: prisma },
        { provide: WorkoutTagService, useValue: tagService },
      ],
    }).compile();

    service = module.get<WorkoutSessionService>(WorkoutSessionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateSession', () => {
    it('updates title and notes without touching tags when tag fields omitted', async () => {
      prisma.workoutSession.findUnique
        .mockResolvedValueOnce({ id: sessionId, userId })
        .mockResolvedValueOnce(sessionWithTags);
      prisma.workoutSession.update.mockResolvedValue({});

      const result = await service.updateSession(sessionId, userId, {
        title: 'Updated',
      });

      expect(prisma.workoutSession.update).toHaveBeenCalledWith({
        where: { id: sessionId },
        data: { title: 'Updated', notes: undefined },
      });
      expect(tagService.syncSessionTags).not.toHaveBeenCalled();
      expect(result.tags).toEqual([{ id: 'tag-1', name: 'Push' }]);
    });

    it('sets tags on a finished session', async () => {
      prisma.workoutSession.findUnique
        .mockResolvedValueOnce({
          id: sessionId,
          userId,
          endAt: new Date(),
        })
        .mockResolvedValueOnce(sessionWithTags);
      prisma.workoutSession.update.mockResolvedValue({});

      await service.updateSession(sessionId, userId, {
        tagIds: ['tag-1'],
      });

      expect(tagService.syncSessionTags).toHaveBeenCalledWith(
        userId,
        sessionId,
        { tagIds: ['tag-1'] },
      );
    });
  });

  describe('startFreeWorkout', () => {
    it('creates session and syncs optional tags', async () => {
      prisma.workoutSession.create.mockResolvedValue({ id: sessionId });
      prisma.workoutSession.findUnique.mockResolvedValue(sessionWithTags);

      await service.startFreeWorkout(userId, 'Leg day', {
        tagIds: ['tag-1'],
      });

      expect(tagService.syncSessionTags).toHaveBeenCalledWith(
        userId,
        sessionId,
        { tagIds: ['tag-1'] },
      );
    });
  });

  describe('finishSession', () => {
    it('finishes session and syncs optional tags', async () => {
      prisma.workoutSession.findUnique
        .mockResolvedValueOnce({
          startAt: new Date('2025-01-01T10:00:00Z'),
          userId,
        })
        .mockResolvedValueOnce(sessionWithTags);
      prisma.workoutSession.update.mockResolvedValue({});

      await service.finishSession(sessionId, userId, {
        newTagNames: ['Heavy'],
      });

      expect(tagService.syncSessionTags).toHaveBeenCalledWith(
        userId,
        sessionId,
        { newTagNames: ['Heavy'] },
      );
    });

    it('rejects finish for another users session', async () => {
      prisma.workoutSession.findUnique.mockResolvedValue({
        startAt: new Date(),
        userId: 'other-user',
      });

      await expect(
        service.finishSession(sessionId, userId, {}),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAllForUser', () => {
    it('filters sessions by tag ids', async () => {
      prisma.workoutSession.findMany.mockResolvedValue([sessionWithTags]);
      prisma.workoutSession.count.mockResolvedValue(1);

      const result = await service.findAllForUser(userId, {
        tagIds: 'tag-1,tag-2',
      });

      expect(prisma.workoutSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId,
            tags: { some: { tagId: { in: ['tag-1', 'tag-2'] } } },
          },
        }),
      );
      expect(result.data[0].tags).toEqual([{ id: 'tag-1', name: 'Push' }]);
    });

    it('returns all sessions when no tag filter provided', async () => {
      prisma.workoutSession.findMany.mockResolvedValue([sessionWithTags]);
      prisma.workoutSession.count.mockResolvedValue(1);

      await service.findAllForUser(userId, {});

      expect(prisma.workoutSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
        }),
      );
    });
  });

  describe('findById', () => {
    it('includes tags in response', async () => {
      prisma.workoutSession.findUnique.mockResolvedValue({
        ...sessionWithTags,
        exercises: [],
      });

      const result = await service.findById(userId, sessionId);

      expect(result.tags).toEqual([{ id: 'tag-1', name: 'Push' }]);
    });

    it('throws when session not found', async () => {
      prisma.workoutSession.findUnique.mockResolvedValue(null);

      await expect(service.findById(userId, sessionId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findActiveWorkout', () => {
    it('includes tags in response', async () => {
      prisma.workoutSession.findFirst.mockResolvedValue(sessionWithTags);

      const result = await service.findActiveWorkout(userId);

      expect(result?.tags).toEqual([{ id: 'tag-1', name: 'Push' }]);
    });
  });
});
