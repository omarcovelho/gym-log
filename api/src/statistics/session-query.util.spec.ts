import {
  buildSessionWhere,
  parseTagIds,
  getWeekKey,
} from './session-query.util';

describe('session-query.util', () => {
  const userId = 'user-1';
  const startDate = new Date('2024-01-01T00:00:00.000Z');
  const endDate = new Date('2024-01-31T23:59:59.999Z');

  describe('parseTagIds', () => {
    it('parses comma-separated tag ids', () => {
      expect(parseTagIds('tag-1, tag-2')).toEqual(['tag-1', 'tag-2']);
    });

    it('returns empty array when undefined', () => {
      expect(parseTagIds(undefined)).toEqual([]);
    });
  });

  describe('buildSessionWhere', () => {
    it('includes date range and finished sessions only', () => {
      const where = buildSessionWhere(userId, { startDate, endDate });

      expect(where).toEqual({
        userId,
        endAt: { not: null },
        startAt: { gte: startDate, lte: endDate },
      });
    });

    it('adds tag filter when tagIds provided', () => {
      const where = buildSessionWhere(userId, {
        startDate,
        endDate,
        tagIds: ['tag-base'],
      });

      expect(where.tags).toEqual({
        some: { tagId: { in: ['tag-base'] } },
      });
    });

    it('adds exercise filter when exerciseId provided', () => {
      const where = buildSessionWhere(userId, {
        startDate,
        endDate,
        exerciseId: 'ex-1',
      });

      expect(where.exercises).toEqual({
        some: { exerciseId: 'ex-1' },
      });
    });
  });

  describe('getWeekKey', () => {
    it('returns ISO Monday for a mid-week date', () => {
      // Wednesday 2024-01-10 -> Monday 2024-01-08
      expect(getWeekKey(new Date('2024-01-10T12:00:00'))).toBe('2024-01-08');
    });
  });
});
