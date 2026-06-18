import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { WorkoutTag } from '../../generated/prisma';
import { CreateWorkoutTagDto } from './dto/create-workout-tag.dto';
import { UpdateWorkoutTagDto } from './dto/update-workout-tag.dto';
import { normalizeTagName, validateTagName } from './workout-tag.util';

export type SessionTag = { id: string; name: string };

export type SyncSessionTagsInput = {
  tagIds?: string[];
  newTagNames?: string[];
};

@Injectable()
export class WorkoutTagService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateWorkoutTagDto) {
    let name: string;
    try {
      name = validateTagName(dto.name);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
    const nameNorm = normalizeTagName(name);

    const existing = await this.prisma.workoutTag.findFirst({
      where: { userId, nameNorm },
    });
    if (existing) throw new ConflictException('Tag already exists');

    return this.prisma.workoutTag.create({
      data: { userId, name, nameNorm },
    });
  }

  async findAllForUser(userId: string) {
    const tags = await this.prisma.workoutTag.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { sessions: true } } },
    });

    return tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      nameNorm: tag.nameNorm,
      createdAt: tag.createdAt,
      sessionCount: tag._count.sessions,
    }));
  }

  async update(userId: string, id: string, dto: UpdateWorkoutTagDto) {
    const tag = await this.prisma.workoutTag.findUnique({ where: { id } });
    if (!tag) throw new NotFoundException('Tag not found');
    if (tag.userId !== userId) throw new ForbiddenException('Access denied');

    let name: string;
    try {
      name = validateTagName(dto.name);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
    const nameNorm = normalizeTagName(name);

    const duplicate = await this.prisma.workoutTag.findFirst({
      where: { userId, nameNorm, NOT: { id } },
    });
    if (duplicate) throw new ConflictException('Tag already exists');

    return this.prisma.workoutTag.update({
      where: { id },
      data: { name, nameNorm },
    });
  }

  async remove(userId: string, id: string) {
    const tag = await this.prisma.workoutTag.findUnique({ where: { id } });
    if (!tag) throw new NotFoundException('Tag not found');
    if (tag.userId !== userId) throw new ForbiddenException('Access denied');

    return this.prisma.workoutTag.delete({ where: { id } });
  }

  async findOrCreateByNames(
    userId: string,
    names: string[],
  ): Promise<WorkoutTag[]> {
    const tags: WorkoutTag[] = [];
    for (const raw of names) {
      let name: string;
      try {
        name = validateTagName(raw);
      } catch (error) {
        throw new BadRequestException((error as Error).message);
      }
      const nameNorm = normalizeTagName(name);
      let tag = await this.prisma.workoutTag.findFirst({
        where: { userId, nameNorm },
      });
      if (!tag) {
        tag = await this.prisma.workoutTag.create({
          data: { userId, name, nameNorm },
        });
      }
      tags.push(tag);
    }
    return tags;
  }

  async syncSessionTags(
    userId: string,
    sessionId: string,
    input: SyncSessionTagsInput,
  ): Promise<SessionTag[] | undefined> {
    if (input.tagIds === undefined && input.newTagNames === undefined) {
      return undefined;
    }

    const tagIds = [...(input.tagIds ?? [])];

    if (input.newTagNames?.length) {
      const created = await this.findOrCreateByNames(userId, input.newTagNames);
      for (const tag of created) {
        if (!tagIds.includes(tag.id)) tagIds.push(tag.id);
      }
    }

    if (tagIds.length > 0) {
      const owned = await this.prisma.workoutTag.findMany({
        where: { id: { in: tagIds }, userId },
      });
      if (owned.length !== tagIds.length) {
        throw new ForbiddenException('Invalid tag ids');
      }
    }

    await this.prisma.workoutSessionTag.deleteMany({ where: { sessionId } });

    if (tagIds.length > 0) {
      await this.prisma.workoutSessionTag.createMany({
        data: tagIds.map((tagId) => ({ sessionId, tagId })),
      });
    }

    return this.getSessionTags(sessionId);
  }

  async getSessionTags(sessionId: string): Promise<SessionTag[]> {
    const rows = await this.prisma.workoutSessionTag.findMany({
      where: { sessionId },
      include: { tag: true },
    });
    return this.mapSessionTags(rows);
  }

  mapSessionTags(
    sessionTags: Array<{ tag: { id: string; name: string } }>,
  ): SessionTag[] {
    return sessionTags
      .map((row) => ({
        id: row.tag.id,
        name: row.tag.name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}
