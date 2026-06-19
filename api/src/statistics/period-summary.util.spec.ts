import {
  buildPeriodSummary,
  metricTrendDirection,
} from './period-summary.util';

describe('buildPeriodSummary', () => {
  const points = [
    {
      avgLoad: 80,
      totalVolume: 640,
      avgReps: 8,
      bestEstimated1RM: 100,
      atDate: '2024-01-08',
    },
    {
      avgLoad: 85,
      totalVolume: 680,
      avgReps: 8,
      bestEstimated1RM: 106,
      atDate: '2024-01-15',
    },
    {
      avgLoad: 90,
      totalVolume: 720,
      avgReps: 8,
      bestEstimated1RM: 112,
      atDate: '2024-01-22',
    },
  ];

  it('returns empty summary when no points', () => {
    const summary = buildPeriodSummary([]);

    expect(summary.pointCount).toBe(0);
    expect(summary.latest).toBeNull();
    expect(summary.deltaVsPrevious).toBeNull();
    expect(summary.trend).toBeNull();
  });

  it('computes best metrics and dates across the period', () => {
    const summary = buildPeriodSummary(points);

    expect(summary.pointCount).toBe(3);
    expect(summary.best.bestEstimated1RM).toBe(112);
    expect(summary.best.bestEstimated1RMAt).toBe('2024-01-22');
    expect(summary.best.avgLoad).toBe(90);
    expect(summary.best.avgLoadAt).toBe('2024-01-22');
    expect(summary.best.peakVolume).toBe(720);
  });

  it('computes latest and delta vs previous point', () => {
    const summary = buildPeriodSummary(points);

    expect(summary.latest?.avgLoad).toBe(90);
    expect(summary.latest?.atDate).toBe('2024-01-22');
    expect(summary.deltaVsPrevious).toEqual({
      avgLoad: 5,
      totalVolume: 40,
      bestEstimated1RM: 6,
    });
  });

  it('computes period trend from first to last point', () => {
    const summary = buildPeriodSummary(points);

    expect(summary.trend).toEqual({
      avgLoadStart: 80,
      avgLoadEnd: 90,
      totalVolumeStart: 640,
      totalVolumeEnd: 720,
      bestEstimated1RMStart: 100,
      bestEstimated1RMEnd: 112,
    });
  });

  it('metricTrendDirection reflects the selected metric only', () => {
    expect(metricTrendDirection(93.8, 90)).toBe('down');
    expect(metricTrendDirection(80, 90)).toBe('up');
  });

  it('returns null delta and trend with a single point', () => {
    const summary = buildPeriodSummary([points[0]]);

    expect(summary.latest?.avgLoad).toBe(80);
    expect(summary.deltaVsPrevious).toBeNull();
    expect(summary.trend).toBeNull();
  });
});
