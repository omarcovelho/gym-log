import { useTranslation } from 'react-i18next'
import { Calendar } from 'lucide-react'
import type { RangePreset } from '@/utils/dateRange'
import { calculateDateRange } from '@/utils/dateRange'

type Props = {
  value: RangePreset
  onChange: (preset: RangePreset) => void
}

export function ProgressRangeFilter({ value, onChange }: Props) {
  const { t } = useTranslation()

  const presets: { value: RangePreset; label: string }[] = [
    { value: '4weeks', label: `4 ${t('progress.weeks', 'semanas')}` },
    { value: '8weeks', label: `8 ${t('progress.weeks', 'semanas')}` },
    { value: '12weeks', label: `12 ${t('progress.weeks', 'semanas')}` },
    { value: '16weeks', label: `16 ${t('progress.weeks', 'semanas')}` },
    { value: '3months', label: `3 ${t('progress.months', 'meses')}` },
    { value: '6months', label: `6 ${t('progress.months', 'meses')}` },
    { value: 'all', label: t('progress.allHistory', 'Todo o histórico') },
  ]

  return (
    <div className="rounded-xl border border-gray-800 bg-[#101010] p-4 md:p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Calendar className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-base font-semibold text-gray-200">
          {t('progress.period', 'Período')}
        </h3>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as RangePreset)}
        className="w-full px-4 py-2 rounded-lg border border-gray-800 bg-[#151515] text-gray-200 text-sm font-medium focus:outline-none focus:border-primary transition"
      >
        {presets.map((preset) => (
          <option key={preset.value} value={preset.value}>
            {preset.label}
          </option>
        ))}
      </select>
    </div>
  )
}

