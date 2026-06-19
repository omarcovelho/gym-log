import { TrendingUp, TrendingDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  type ChartPointWithDelta,
  type ProgressMetricMode,
  deltaColorClass,
  formatDeltaAbsolute,
  formatMetricValue,
  formatProgressDateLabel,
} from '@/utils/progressChart'

type Props = {
  active?: boolean
  payload?: Array<{ payload: ChartPointWithDelta }>
  metricMode: ProgressMetricMode
  metricLabel: string
  gapFree?: boolean
}

export function ProgressChartTooltip({
  active,
  payload,
  metricMode,
  metricLabel,
  gapFree = false,
}: Props) {
  const { t, i18n } = useTranslation()

  if (!active || !payload?.length) return null

  const data = payload[0].payload as ChartPointWithDelta
  const value = getTooltipValue(data, metricMode)

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm shadow-lg">
      {gapFree ? (
        <>
          <p className="text-gray-400 mb-0.5">
            {formatProgressDateLabel(data.dateKey, i18n.language)}
          </p>
          <p className="text-gray-500 text-xs mb-1">
            {t('progress.point')} {data.label}
          </p>
        </>
      ) : (
        <p className="text-gray-400 mb-1">{data.label}</p>
      )}
      <p className="text-gray-200">
        {metricLabel}: {formatMetricValue(value, metricMode, i18n.language)}{' '}
        {t('workout.kg')}
      </p>
      {data.deltaAbs != null && data.deltaPct != null && data.deltaAbs !== 0 && (
        <p className={`mt-1 flex items-center gap-1 ${deltaColorClass(data.deltaAbs)}`}>
          {data.deltaAbs > 0 ? (
            <TrendingUp className="w-4 h-4 shrink-0" />
          ) : (
            <TrendingDown className="w-4 h-4 shrink-0" />
          )}
          <span>
            {formatDeltaAbsolute(data.deltaAbs, metricMode, i18n.language)}{' '}
            {t('workout.kg')} ({data.deltaPct})
          </span>
        </p>
      )}
    </div>
  )
}

function getTooltipValue(data: ChartPointWithDelta, mode: ProgressMetricMode): number {
  if (mode === 'volume') return data.totalVolume
  if (mode === 'e1rm') return data.bestEstimated1RM
  return data.avgLoad
}
