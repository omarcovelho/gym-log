import { buildEvolutionPeriodSummary } from './evolution-period-summary.util';

describe('buildEvolutionPeriodSummary', () => {
  const points = [
    { volume: 10000, sets: 20, atDate: '2024-01-08' },
    { volume: 12000, sets: 22, atDate: '2024-01-15' },
    { volume: 11000, sets: 21, atDate: '2024-01-22' },
  ];

  it('returns empty summary when no points', () => {
    const summary = buildEvolutionPeriodSummary([]);

    expect(summary.pointCount).toBe(0);
    expect(summary.latest).toBeNull();
    expect(summary.trend).toBeNull();
  });

  it('computes best volume and sets across the period', () => {
    const summary = buildEvolutionPeriodSummary(points);

    expect(summary.pointCount).toBe(3);
    expect(summary.best.peakVolume).toBe(12000);
    expect(summary.best.peakSets).toBe(22);
  });

  it('computes latest and period trend from first to last point', () => {
    const summary = buildEvolutionPeriodSummary(points);

    expect(summary.latest).toEqual({
      volume: 11000,
      sets: 21,
      atDate: '2024-01-22',
    });
    expect(summary.trend).toEqual({
      volumeStart: 10000,
      volumeEnd: 11000,
      setsStart: 20,
      setsEnd: 21,
    });
  });

  it('returns null trend with a single point', () => {
    const summary = buildEvolutionPeriodSummary([points[0]]);

    expect(summary.latest?.volume).toBe(10000);
    expect(summary.trend).toBeNull();
  });
});
