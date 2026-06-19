import { TrendingUp, TrendingDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  deltaColorClass,
  formatDeltaAbsolute,
  formatMetricValue,
  formatProgressDateLabel,
  type OverviewMetricMode,
} from '@/utils/progressChart'

type OverviewPoint = {
  label: string
  dateKey: string
  value: number
  deltaAbs: number | null
  deltaPct: string | null
}

type Props = {
  active?: boolean
  payload?: Array<{ payload: OverviewPoint }>
  metricMode: OverviewMetricMode
  metricLabel: string
  gapFree?: boolean
}

export function OverviewProgressTooltip({
  active,
  payload,
  metricMode,
  metricLabel,
  gapFree = false,
}: Props) {
  const { t, i18n } = useTranslation()

  if (!active || !payload?.length) return null

  const data = payload[0].payload
  const unit = metricMode === 'volume' ? t('workout.kg') : ''

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
        {metricLabel}: {formatMetricValue(data.value, metricMode, i18n.language)}
        {unit ? ` ${unit}` : ''}
      </p>
      {data.deltaAbs != null && data.deltaPct != null && data.deltaAbs !== 0 && (
        <p className={`mt-1 flex items-center gap-1 ${deltaColorClass(data.deltaAbs)}`}>
          {data.deltaAbs > 0 ? (
            <TrendingUp className="w-4 h-4 shrink-0" />
          ) : (
            <TrendingDown className="w-4 h-4 shrink-0" />
          )}
          <span>
            {formatDeltaAbsolute(data.deltaAbs, metricMode, i18n.language)}
            {unit ? ` ${unit}` : ''} ({data.deltaPct})
          </span>
        </p>
      )}
    </div>
  )
}
