import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type {
  ExercisePeriodSummary,
  EvolutionPeriodSummary,
} from '@/api/workoutSession'
import type { ProgressGranularity } from '@/components/ProgressTagFilter'
import {
  deltaColorClass,
  formatDeltaPercent,
  formatMetricValue,
  formatProgressDateLabel,
  getEvolutionBestValue,
  getExerciseBestValue,
  type OverviewMetricMode,
  type ProgressMetricMode,
} from '@/utils/progressChart'

type ExerciseProps = {
  variant: 'exercise'
  summary: ExercisePeriodSummary
  metricMode: ProgressMetricMode
  granularity: ProgressGranularity
  has1RMData: boolean
}

type EvolutionProps = {
  variant: 'evolution'
  summary: EvolutionPeriodSummary
  metricMode: OverviewMetricMode
  granularity: ProgressGranularity
}

type Props = ExerciseProps | EvolutionProps

function trendDirection(start: number, end: number): 'up' | 'down' | 'stable' {
  if (end > start) return 'up'
  if (end < start) return 'down'
  return 'stable'
}

function TrendIcon({ direction }: { direction: 'up' | 'down' | 'stable' }) {
  if (direction === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />
  if (direction === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />
  return <Minus className="w-4 h-4 text-gray-500" />
}

export function ProgressPeriodSummaryCard(props: Props) {
  if (props.variant === 'exercise') {
    return <ExerciseSummaryCard {...props} />
  }
  return <EvolutionSummaryCard {...props} />
}

function ExerciseSummaryCard({
  summary,
  metricMode,
  granularity,
  has1RMData,
}: ExerciseProps) {
  const { t, i18n } = useTranslation()

  if (summary.pointCount === 0) return null
  if (metricMode === 'e1rm' && !has1RMData) return null

  const formatDate = (date: string | null) =>
    date ? formatProgressDateLabel(date, i18n.language) : null

  const pointCountLabel =
    granularity === 'session'
      ? t('progress.sessionCount', { count: summary.pointCount })
      : t('progress.weekCount', { count: summary.pointCount })

  const bestValue = getExerciseBestValue(summary, metricMode)
  const bestDate =
    metricMode === 'e1rm'
      ? formatDate(summary.best.bestEstimated1RMAt)
      : metricMode === 'load'
        ? formatDate(summary.best.avgLoadAt)
        : null

  const latestValue = summary.latest
    ? metricMode === 'volume'
      ? summary.latest.totalVolume
      : metricMode === 'e1rm'
        ? summary.latest.bestEstimated1RM
        : summary.latest.avgLoad
    : null

  const latestDate = summary.latest
    ? formatDate(summary.latest.atDate)
    : null

  const trendStart = summary.trend
    ? metricMode === 'volume'
      ? summary.trend.totalVolumeStart
      : metricMode === 'e1rm'
        ? summary.trend.bestEstimated1RMStart
        : summary.trend.avgLoadStart
    : null

  const trendEnd = summary.trend
    ? metricMode === 'volume'
      ? summary.trend.totalVolumeEnd
      : metricMode === 'e1rm'
        ? summary.trend.bestEstimated1RMEnd
        : summary.trend.avgLoadEnd
    : null

  const trendDelta =
    trendStart != null && trendEnd != null ? trendEnd - trendStart : null

  const trendPercent =
    trendDelta != null && trendStart != null
      ? formatDeltaPercent(trendDelta, trendStart)
      : null

  const metricTrendDirection =
    trendStart != null && trendEnd != null
      ? trendDirection(trendStart, trendEnd)
      : 'stable'

  const unit = t('workout.kg')

  return (
    <SummaryShell title={t('progress.periodSummary')} subtitle={pointCountLabel}>
      <SummaryRow
        label={t('progress.best')}
        value={`${formatMetricValue(bestValue, metricMode, i18n.language)} ${unit}${bestDate ? ` · ${bestDate}` : ''}`}
      />
      {summary.latest && latestValue != null && (
        <SummaryRow
          label={t('progress.latestShort')}
          value={`${formatMetricValue(latestValue, metricMode, i18n.language)} ${unit}${latestDate ? ` · ${latestDate}` : ''}`}
        />
      )}
      {summary.trend && trendStart != null && trendEnd != null && (
        <TrendRow
          label={t('progress.trendLine')}
          direction={metricTrendDirection}
          range={`${formatMetricValue(trendStart, metricMode, i18n.language)} → ${formatMetricValue(trendEnd, metricMode, i18n.language)} ${unit}`}
          percent={trendPercent}
          delta={trendDelta}
        />
      )}
    </SummaryShell>
  )
}

function EvolutionSummaryCard({
  summary,
  metricMode,
  granularity,
}: EvolutionProps) {
  const { t, i18n } = useTranslation()

  if (summary.pointCount === 0) return null

  const formatDate = (date: string | null) =>
    date ? formatProgressDateLabel(date, i18n.language) : null

  const pointCountLabel =
    granularity === 'session'
      ? t('progress.sessionCount', { count: summary.pointCount })
      : t('progress.weekCount', { count: summary.pointCount })

  const bestValue = getEvolutionBestValue(summary, metricMode)
  const latestValue =
    summary.latest != null
      ? metricMode === 'volume'
        ? summary.latest.volume
        : summary.latest.sets
      : null
  const latestDate = summary.latest
    ? formatDate(summary.latest.atDate)
    : null

  const trendStart = summary.trend
    ? metricMode === 'volume'
      ? summary.trend.volumeStart
      : summary.trend.setsStart
    : null

  const trendEnd = summary.trend
    ? metricMode === 'volume'
      ? summary.trend.volumeEnd
      : summary.trend.setsEnd
    : null

  const trendDelta =
    trendStart != null && trendEnd != null ? trendEnd - trendStart : null

  const trendPercent =
    trendDelta != null && trendStart != null
      ? formatDeltaPercent(trendDelta, trendStart)
      : null

  const metricTrendDirection =
    trendStart != null && trendEnd != null
      ? trendDirection(trendStart, trendEnd)
      : 'stable'

  const unit = metricMode === 'volume' ? t('workout.kg') : ''

  return (
    <SummaryShell title={t('progress.periodSummary')} subtitle={pointCountLabel}>
      <SummaryRow
        label={t('progress.best')}
        value={`${formatMetricValue(bestValue, metricMode, i18n.language)}${unit ? ` ${unit}` : ''}`}
      />
      {summary.latest && latestValue != null && (
        <SummaryRow
          label={t('progress.latestShort')}
          value={`${formatMetricValue(latestValue, metricMode, i18n.language)}${unit ? ` ${unit}` : ''}${latestDate ? ` · ${latestDate}` : ''}`}
        />
      )}
      {summary.trend && trendStart != null && trendEnd != null && (
        <TrendRow
          label={t('progress.trendLine')}
          direction={metricTrendDirection}
          range={`${formatMetricValue(trendStart, metricMode, i18n.language)} → ${formatMetricValue(trendEnd, metricMode, i18n.language)}${unit ? ` ${unit}` : ''}`}
          percent={trendPercent}
          delta={trendDelta}
        />
      )}
    </SummaryShell>
  )
}

function SummaryShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-gray-800 bg-[#151515] p-4 space-y-3">
      <div>
        <h4 className="text-sm font-semibold text-gray-300">{title}</h4>
        <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-0.5 items-baseline text-sm">
      <span className="text-gray-400 leading-snug">{label}</span>
      <span className="text-gray-200 text-right whitespace-nowrap tabular-nums shrink-0">
        {value}
      </span>
    </div>
  )
}

function TrendRow({
  label,
  direction,
  range,
  percent,
  delta,
}: {
  label: string
  direction: 'up' | 'down' | 'stable'
  range: string
  percent: string | null
  delta: number | null
}) {
  return (
    <div className="space-y-1.5 text-sm">
      <span className="text-gray-400 block leading-snug">{label}</span>
      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap tabular-nums">
        <TrendIcon direction={direction} />
        <span className="text-gray-200">{range}</span>
        {percent != null && delta != null && (
          <span className={deltaColorClass(delta)}>({percent})</span>
        )}
      </div>
    </div>
  )
}
