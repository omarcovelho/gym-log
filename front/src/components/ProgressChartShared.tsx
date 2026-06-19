import { useTranslation } from 'react-i18next'
import { CartesianGrid } from 'recharts'

type LegendEntry = {
  value?: string
  color?: string
  dataKey?: string | number
}

type CustomLegendProps = {
  payload?: LegendEntry[]
  referenceBest?: number | null
}

export const PROGRESS_CHART_MARGIN = { top: 8, right: 12, bottom: 4, left: 0 }

export function ProgressChartGrid() {
  return (
    <CartesianGrid
      strokeDasharray="3 3"
      stroke="#1F2937"
      vertical={false}
    />
  )
}

export function progressReferenceLineProps(referenceBest: number) {
  return {
    y: referenceBest,
    stroke: '#4B5563',
    strokeDasharray: '4 6',
    strokeWidth: 1,
    ifOverflow: 'extendDomain' as const,
  }
}

export function progressTrendLineProps(name: string) {
  return {
    type: 'monotone' as const,
    dataKey: 'trend',
    stroke: '#4B5563',
    strokeWidth: 1.5,
    strokeDasharray: '6 4',
    dot: false,
    activeDot: false,
    name,
  }
}

export function ProgressChartLegend({
  payload,
  referenceBest,
}: CustomLegendProps) {
  const { t } = useTranslation()

  if (!payload?.length && !referenceBest) return null

  return (
    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
      {payload?.map((entry, index) => (
        <li key={`${entry.value ?? entry.dataKey ?? index}`} className="flex items-center gap-1.5">
          <span
            className="inline-block w-4 h-0 border-t-2"
            style={{
              borderColor: entry.color,
              borderStyle: entry.dataKey === 'trend' ? 'dashed' : 'solid',
            }}
          />
          <span>{entry.value}</span>
        </li>
      ))}
      {referenceBest != null && referenceBest > 0 && (
        <li className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-0 border-t border-dashed border-gray-500" />
          <span>{t('progress.referenceBest')}</span>
        </li>
      )}
    </ul>
  )
}
