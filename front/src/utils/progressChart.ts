/** Format ISO date or week key for chart axis labels */
export function formatProgressDateLabel(
  dateOrWeek: string,
  locale: string,
): string {
  const match = dateOrWeek.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    const [, yearStr, monthStr, dayStr] = match
    const date = new Date(
      parseInt(yearStr, 10),
      parseInt(monthStr, 10) - 1,
      parseInt(dayStr, 10),
    )
    return date.toLocaleDateString(locale === 'pt' ? 'pt-BR' : 'en-US', {
      day: '2-digit',
      month: 'short',
    })
  }

  const parsed = new Date(dateOrWeek)
  if (!isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString(locale === 'pt' ? 'pt-BR' : 'en-US', {
      day: '2-digit',
      month: 'short',
    })
  }

  return dateOrWeek
}

export type ProgressMetricMode = 'load' | 'volume' | 'e1rm'
export type OverviewMetricMode = 'volume' | 'sets'
export type AnyProgressMetricMode = ProgressMetricMode | OverviewMetricMode

export function getMetricValue(
  point: { avgLoad: number; totalVolume: number; bestEstimated1RM: number },
  mode: ProgressMetricMode,
): number {
  if (mode === 'volume') return point.totalVolume
  if (mode === 'e1rm') return point.bestEstimated1RM
  return point.avgLoad
}

export function formatMetricValue(
  value: number,
  mode: AnyProgressMetricMode,
  locale: string,
): string {
  if (mode === 'volume') {
    return Math.round(value).toLocaleString(locale === 'pt' ? 'pt-BR' : 'en-US')
  }
  if (mode === 'sets') {
    return Math.round(value).toLocaleString(locale === 'pt' ? 'pt-BR' : 'en-US')
  }
  return value.toFixed(1)
}

export function formatDeltaPercent(delta: number, previous: number): string | null {
  if (previous === 0) return null
  const pct = (delta / previous) * 100
  const sign = pct > 0 ? '+' : ''
  return `${sign}${pct.toFixed(1)}%`
}

export function formatDeltaAbsolute(
  delta: number,
  mode: AnyProgressMetricMode,
  locale: string,
): string {
  const sign = delta > 0 ? '+' : ''
  if (mode === 'volume' || mode === 'sets') {
    return `${sign}${Math.round(delta).toLocaleString(locale === 'pt' ? 'pt-BR' : 'en-US')}`
  }
  return `${sign}${delta.toFixed(1)}`
}

export function deltaColorClass(delta: number): string {
  if (delta > 0) return 'text-green-500'
  if (delta < 0) return 'text-red-400'
  return 'text-gray-500'
}

export type ChartPointWithDelta = {
  label: string
  dateKey: string
  avgLoad: number
  totalVolume: number
  bestEstimated1RM: number
  deltaAbs: number | null
  deltaPct: string | null
  trend: number | null
  referenceBest: number | null
}

export type OverviewChartPoint = {
  label: string
  dateKey: string
  value: number
  deltaAbs: number | null
  deltaPct: string | null
  trend: number | null
  referenceBest: number | null
}

export function buildGapFreeLabel(
  index: number,
  dateKey: string,
  locale: string,
  gapFree: boolean,
): string {
  if (gapFree) return String(index + 1)
  return formatProgressDateLabel(dateKey, locale)
}

export function calculateTrendLine(values: number[]): Array<number | null> {
  if (values.length < 2) {
    return values.map(() => null)
  }

  const n = values.length
  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumX2 = 0

  values.forEach((value, index) => {
    sumX += index
    sumY += value
    sumXY += index * value
    sumX2 += index * index
  })

  const denominator = n * sumX2 - sumX * sumX
  if (denominator === 0) {
    return values.map(() => null)
  }

  const slope = (n * sumXY - sumX * sumY) / denominator
  const intercept = (sumY - slope * sumX) / n

  return values.map((_, index) => slope * index + intercept)
}

export function attachTrendLine<T extends Record<string, unknown>>(
  points: T[],
  getValue: (point: T) => number,
): Array<T & { trend: number | null }> {
  const trendValues = calculateTrendLine(points.map(getValue))
  return points.map((point, index) => ({
    ...point,
    trend: trendValues[index],
  }))
}

export function buildChartPointsWithDeltas(
  points: Array<{
    dateKey: string
    avgLoad: number
    totalVolume: number
    bestEstimated1RM: number
  }>,
  mode: ProgressMetricMode,
  locale: string,
  options?: { gapFree?: boolean; referenceBest?: number | null },
): ChartPointWithDelta[] {
  const gapFree = options?.gapFree ?? false
  const referenceBest = options?.referenceBest ?? null
  const values = points.map((point) => getMetricValue(point, mode))

  const withDeltas = points.map((point, index) => {
    const value = values[index]
    const previous = index > 0 ? values[index - 1] : null
    const deltaAbs = previous != null ? value - previous : null
    const deltaPct =
      deltaAbs != null && previous != null
        ? formatDeltaPercent(deltaAbs, previous)
        : null

    return {
      label: buildGapFreeLabel(index, point.dateKey, locale, gapFree),
      dateKey: point.dateKey,
      avgLoad: point.avgLoad,
      totalVolume: point.totalVolume,
      bestEstimated1RM: point.bestEstimated1RM,
      deltaAbs,
      deltaPct,
      trend: null as number | null,
      referenceBest,
    }
  })

  const trendValues = calculateTrendLine(values)
  return withDeltas.map((point, index) => ({
    ...point,
    trend: trendValues[index],
  }))
}

export function buildOverviewChartPointsWithDeltas(
  points: Array<{ dateKey: string; value: number }>,
  locale: string,
  options?: { gapFree?: boolean; referenceBest?: number | null },
): OverviewChartPoint[] {
  const gapFree = options?.gapFree ?? false
  const referenceBest = options?.referenceBest ?? null
  const values = points.map((point) => point.value)

  const withDeltas = points.map((point, index) => {
    const value = values[index]
    const previous = index > 0 ? values[index - 1] : null
    const deltaAbs = previous != null ? value - previous : null
    const deltaPct =
      deltaAbs != null && previous != null
        ? formatDeltaPercent(deltaAbs, previous)
        : null

    return {
      label: buildGapFreeLabel(index, point.dateKey, locale, gapFree),
      dateKey: point.dateKey,
      value,
      deltaAbs,
      deltaPct,
      trend: null as number | null,
      referenceBest,
    }
  })

  const trendValues = calculateTrendLine(values)
  return withDeltas.map((point, index) => ({
    ...point,
    trend: trendValues[index],
  }))
}

export function getExerciseBestValue(
  summary: {
    best: {
      avgLoad: number
      peakVolume: number
      bestEstimated1RM: number
    }
  },
  mode: ProgressMetricMode,
): number {
  if (mode === 'volume') return summary.best.peakVolume
  if (mode === 'e1rm') return summary.best.bestEstimated1RM
  return summary.best.avgLoad
}

export function getEvolutionBestValue(
  summary: { best: { peakVolume: number; peakSets: number } },
  mode: OverviewMetricMode,
): number {
  return mode === 'volume' ? summary.best.peakVolume : summary.best.peakSets
}
