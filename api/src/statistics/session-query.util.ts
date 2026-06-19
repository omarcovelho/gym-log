import type { Prisma } from '../../generated/prisma';

export type SessionQueryFilters = {
  startDate?: Date;
  endDate?: Date;
  tagIds?: string[];
  exerciseId?: string;
};

export function parseTagIds(tagIds?: string): string[] {
  return (
    tagIds
      ?.split(',')
      .map((id) => id.trim())
      .filter(Boolean) ?? []
  );
}

export function buildSessionWhere(
  userId: string,
  filters: SessionQueryFilters,
): Prisma.WorkoutSessionWhereInput {
  const tagIdList = filters.tagIds ?? [];

  return {
    userId,
    endAt: { not: null },
    ...(filters.startDate &&
      filters.endDate && {
        startAt: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      }),
    ...(tagIdList.length > 0 && {
      tags: { some: { tagId: { in: tagIdList } } },
    }),
    ...(filters.exerciseId && {
      exercises: { some: { exerciseId: filters.exerciseId } },
    }),
  };
}

/** ISO Monday week key: YYYY-MM-DD */
export function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dayOfWeek = d.getDay();
  const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);

  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const day = String(monday.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
