import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { WorkoutTagService } from './workout-tag.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('WorkoutTagService', () => {
  let service: WorkoutTagService;
  let prisma: {
    workoutTag: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
    };
    workoutSessionTag: {
      deleteMany: jest.Mock;
      createMany: jest.Mock;
      findMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const userId = 'user-1';
  const otherUserId = 'user-2';

  beforeEach(async () => {
    prisma = {
      workoutTag: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      workoutSessionTag: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn((ops) => Promise.all(ops)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkoutTagService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<WorkoutTagService>(WorkoutTagService);
  });

  describe('create', () => {
    it('trims name and stores nameNorm', async () => {
      prisma.workoutTag.findFirst.mockResolvedValue(null);
      prisma.workoutTag.create.mockResolvedValue({
        id: 'tag-1',
        userId,
        name: 'Leg Day',
        nameNorm: 'leg day',
      });

      const result = await service.create(userId, { name: '  Leg Day  ' });

      expect(prisma.workoutTag.create).toHaveBeenCalledWith({
        data: { userId, name: 'Leg Day', nameNorm: 'leg day' },
      });
      expect(result.name).toBe('Leg Day');
    });

    it('rejects empty name', async () => {
      await expect(service.create(userId, { name: '   ' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects duplicate name case-insensitively', async () => {
      prisma.workoutTag.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(service.create(userId, { name: 'LEG DAY' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAllForUser', () => {
    it('returns tags with session counts for the user', async () => {
      prisma.workoutTag.findMany.mockResolvedValue([
        {
          id: 'tag-1',
          name: 'Push',
          nameNorm: 'push',
          createdAt: new Date(),
          _count: { sessions: 3 },
        },
      ]);

      const result = await service.findAllForUser(userId);

      expect(prisma.workoutTag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId } }),
      );
      expect(result[0]).toEqual(
        expect.objectContaining({ id: 'tag-1', name: 'Push', sessionCount: 3 }),
      );
    });
  });

  describe('update', () => {
    it('renames a tag owned by the user', async () => {
      prisma.workoutTag.findUnique.mockResolvedValue({
        id: 'tag-1',
        userId,
        name: 'Old',
        nameNorm: 'old',
      });
      prisma.workoutTag.findFirst.mockResolvedValue(null);
      prisma.workoutTag.update.mockResolvedValue({
        id: 'tag-1',
        userId,
        name: 'New',
        nameNorm: 'new',
      });

      const result = await service.update(userId, 'tag-1', { name: 'New' });

      expect(result.name).toBe('New');
    });

    it('rejects rename to duplicate nameNorm', async () => {
      prisma.workoutTag.findUnique.mockResolvedValue({
        id: 'tag-1',
        userId,
        name: 'Old',
        nameNorm: 'old',
      });
      prisma.workoutTag.findFirst.mockResolvedValue({ id: 'tag-2' });

      await expect(
        service.update(userId, 'tag-1', { name: 'Existing' }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects update for another users tag', async () => {
      prisma.workoutTag.findUnique.mockResolvedValue({
        id: 'tag-1',
        userId: otherUserId,
      });

      await expect(
        service.update(userId, 'tag-1', { name: 'New' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('deletes tag owned by user', async () => {
      prisma.workoutTag.findUnique.mockResolvedValue({
        id: 'tag-1',
        userId,
      });
      prisma.workoutTag.delete.mockResolvedValue({ id: 'tag-1' });

      await service.remove(userId, 'tag-1');

      expect(prisma.workoutTag.delete).toHaveBeenCalledWith({
        where: { id: 'tag-1' },
      });
    });

    it('rejects delete for another users tag', async () => {
      prisma.workoutTag.findUnique.mockResolvedValue({
        id: 'tag-1',
        userId: otherUserId,
      });

      await expect(service.remove(userId, 'tag-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('syncSessionTags', () => {
    const sessionId = 'session-1';

    it('replaces join rows with provided tag ids', async () => {
      prisma.workoutTag.findMany.mockResolvedValue([
        { id: 'tag-1', userId, name: 'Push', nameNorm: 'push' },
        { id: 'tag-2', userId, name: 'Heavy', nameNorm: 'heavy' },
      ]);
      prisma.workoutSessionTag.deleteMany.mockResolvedValue({ count: 1 });
      prisma.workoutSessionTag.createMany.mockResolvedValue({ count: 2 });
      prisma.workoutSessionTag.findMany.mockResolvedValue([
        { tag: { id: 'tag-1', name: 'Push' } },
        { tag: { id: 'tag-2', name: 'Heavy' } },
      ]);

      const result = await service.syncSessionTags(userId, sessionId, {
        tagIds: ['tag-1', 'tag-2'],
      });

      expect(prisma.workoutSessionTag.deleteMany).toHaveBeenCalledWith({
        where: { sessionId },
      });
      expect(prisma.workoutSessionTag.createMany).toHaveBeenCalledWith({
        data: [
          { sessionId, tagId: 'tag-1' },
          { sessionId, tagId: 'tag-2' },
        ],
      });
      expect(result).toEqual([
        { id: 'tag-2', name: 'Heavy' },
        { id: 'tag-1', name: 'Push' },
      ]);
    });

    it('find-or-creates tags from newTagNames', async () => {
      prisma.workoutTag.findFirst.mockResolvedValue(null);
      prisma.workoutTag.create.mockResolvedValue({
        id: 'tag-new',
        userId,
        name: 'Deload',
        nameNorm: 'deload',
      });
      prisma.workoutTag.findMany.mockResolvedValue([
        { id: 'tag-new', userId, name: 'Deload', nameNorm: 'deload' },
      ]);
      prisma.workoutSessionTag.deleteMany.mockResolvedValue({ count: 0 });
      prisma.workoutSessionTag.createMany.mockResolvedValue({ count: 1 });
      prisma.workoutSessionTag.findMany.mockResolvedValue([
        { tag: { id: 'tag-new', name: 'Deload' } },
      ]);

      const result = await service.syncSessionTags(userId, sessionId, {
        newTagNames: ['Deload'],
      });

      expect(prisma.workoutTag.create).toHaveBeenCalled();
      expect(result).toEqual([{ id: 'tag-new', name: 'Deload' }]);
    });

    it('rejects foreign tag ids', async () => {
      prisma.workoutTag.findMany.mockResolvedValue([]);

      await expect(
        service.syncSessionTags(userId, sessionId, { tagIds: ['foreign'] }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows clearing all tags with empty arrays', async () => {
      prisma.workoutSessionTag.deleteMany.mockResolvedValue({ count: 2 });
      prisma.workoutSessionTag.findMany.mockResolvedValue([]);

      const result = await service.syncSessionTags(userId, sessionId, {
        tagIds: [],
      });

      expect(prisma.workoutSessionTag.deleteMany).toHaveBeenCalled();
      expect(prisma.workoutSessionTag.createMany).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('does nothing when tag fields are omitted', async () => {
      const result = await service.syncSessionTags(userId, sessionId, {});

      expect(prisma.workoutSessionTag.deleteMany).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
  });

  describe('findOrCreateByNames', () => {
    it('returns existing tag when nameNorm matches', async () => {
      const existing = { id: 'tag-1', userId, name: 'Push', nameNorm: 'push' };
      prisma.workoutTag.findFirst.mockResolvedValue(existing);

      const result = await service.findOrCreateByNames(userId, ['push']);

      expect(result).toEqual([existing]);
      expect(prisma.workoutTag.create).not.toHaveBeenCalled();
    });
  });

  it('throws when tag not found on update', async () => {
    prisma.workoutTag.findUnique.mockResolvedValue(null);

    await expect(
      service.update(userId, 'missing', { name: 'X' }),
    ).rejects.toThrow(NotFoundException);
  });
});
