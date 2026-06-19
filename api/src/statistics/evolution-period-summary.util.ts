export type EvolutionPeriodSummaryPoint = {
  volume: number;
  sets: number;
  atDate: string;
};

export type EvolutionPeriodSummary = {
  pointCount: number;
  best: {
    peakVolume: number;
    peakSets: number;
  };
  latest: {
    volume: number;
    sets: number;
    atDate: string;
  } | null;
  trend: {
    volumeStart: number;
    volumeEnd: number;
    setsStart: number;
    setsEnd: number;
  } | null;
};

const emptyBest = (): EvolutionPeriodSummary['best'] => ({
  peakVolume: 0,
  peakSets: 0,
});

export function buildEvolutionPeriodSummary(
  points: EvolutionPeriodSummaryPoint[],
): EvolutionPeriodSummary {
  if (points.length === 0) {
    return {
      pointCount: 0,
      best: emptyBest(),
      latest: null,
      trend: null,
    };
  }

  let peakVolume = 0;
  let peakSets = 0;

  for (const point of points) {
    if (point.volume > peakVolume) {
      peakVolume = point.volume;
    }
    if (point.sets > peakSets) {
      peakSets = point.sets;
    }
  }

  const latest = points[points.length - 1];
  const first = points[0];

  return {
    pointCount: points.length,
    best: { peakVolume, peakSets },
    latest: {
      volume: latest.volume,
      sets: latest.sets,
      atDate: latest.atDate,
    },
    trend:
      points.length >= 2
        ? {
            volumeStart: first.volume,
            volumeEnd: latest.volume,
            setsStart: first.sets,
            setsEnd: latest.sets,
          }
        : null,
  };
}
