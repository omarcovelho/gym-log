export type PeriodSummaryPoint = {
  avgLoad: number;
  totalVolume: number;
  avgReps: number;
  bestEstimated1RM: number;
  atDate: string;
};

export type PeriodSummary = {
  pointCount: number;
  best: {
    avgLoad: number;
    avgLoadAt: string | null;
    totalVolume: number;
    peakVolume: number;
    avgReps: number;
    bestEstimated1RM: number;
    bestEstimated1RMAt: string | null;
  };
  latest: {
    avgLoad: number;
    totalVolume: number;
    avgReps: number;
    bestEstimated1RM: number;
    atDate: string;
  } | null;
  deltaVsPrevious: {
    avgLoad: number;
    totalVolume: number;
    bestEstimated1RM: number;
  } | null;
  trend: {
    avgLoadStart: number;
    avgLoadEnd: number;
    totalVolumeStart: number;
    totalVolumeEnd: number;
    bestEstimated1RMStart: number;
    bestEstimated1RMEnd: number;
  } | null;
};

const emptyBest = (): PeriodSummary['best'] => ({
  avgLoad: 0,
  avgLoadAt: null,
  totalVolume: 0,
  peakVolume: 0,
  avgReps: 0,
  bestEstimated1RM: 0,
  bestEstimated1RMAt: null,
});

function metricTrendDirection(
  start: number,
  end: number,
): 'up' | 'down' | 'stable' {
  if (end > start) return 'up';
  if (end < start) return 'down';
  return 'stable';
}

export function buildPeriodSummary(
  points: PeriodSummaryPoint[],
): PeriodSummary {
  if (points.length === 0) {
    return {
      pointCount: 0,
      best: emptyBest(),
      latest: null,
      deltaVsPrevious: null,
      trend: null,
    };
  }

  let bestAvgLoad = 0;
  let bestAvgLoadAt: string | null = null;
  let peakVolume = 0;
  let bestEstimated1RM = 0;
  let bestEstimated1RMAt: string | null = null;
  let bestAvgReps = 0;

  for (const point of points) {
    if (point.avgLoad > bestAvgLoad) {
      bestAvgLoad = point.avgLoad;
      bestAvgLoadAt = point.atDate;
    }
    if (point.totalVolume > peakVolume) {
      peakVolume = point.totalVolume;
    }
    if (point.bestEstimated1RM > bestEstimated1RM) {
      bestEstimated1RM = point.bestEstimated1RM;
      bestEstimated1RMAt = point.atDate;
    }
    if (point.avgReps > bestAvgReps) {
      bestAvgReps = point.avgReps;
    }
  }

  const latest = points[points.length - 1];
  const previous = points.length > 1 ? points[points.length - 2] : null;
  const first = points[0];

  return {
    pointCount: points.length,
    best: {
      avgLoad: bestAvgLoad,
      avgLoadAt: bestAvgLoadAt,
      totalVolume: peakVolume,
      peakVolume,
      avgReps: bestAvgReps,
      bestEstimated1RM,
      bestEstimated1RMAt,
    },
    latest: {
      avgLoad: latest.avgLoad,
      totalVolume: latest.totalVolume,
      avgReps: latest.avgReps,
      bestEstimated1RM: latest.bestEstimated1RM,
      atDate: latest.atDate,
    },
    deltaVsPrevious: previous
      ? {
          avgLoad: latest.avgLoad - previous.avgLoad,
          totalVolume: latest.totalVolume - previous.totalVolume,
          bestEstimated1RM: latest.bestEstimated1RM - previous.bestEstimated1RM,
        }
      : null,
    trend:
      points.length >= 2
        ? {
            avgLoadStart: first.avgLoad,
            avgLoadEnd: latest.avgLoad,
            totalVolumeStart: first.totalVolume,
            totalVolumeEnd: latest.totalVolume,
            bestEstimated1RMStart: first.bestEstimated1RM,
            bestEstimated1RMEnd: latest.bestEstimated1RM,
          }
        : null,
  };
}

export { metricTrendDirection };
