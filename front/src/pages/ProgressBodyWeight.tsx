import { useState, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ProgressRangeFilter } from '@/components/ProgressRangeFilter'
import type { RangePreset } from '@/utils/dateRange'
import { calculateDateRange } from '@/utils/dateRange'
import { MeasurementsCharts } from '@/components/MeasurementsCharts'

export default function ProgressBodyWeight() {
  const { t } = useTranslation()
  const location = useLocation()
  const [selectedRange, setSelectedRange] = useState<RangePreset>('4weeks')

  // Calcular dates do range selecionado
  const dateRange = useMemo(() => calculateDateRange(selectedRange), [selectedRange])

  const isOverviewActive = location.pathname === '/app/progress'
  const isExerciseActive = location.pathname === '/app/progress/exercise'
  const isBodyWeightActive = location.pathname === '/app/progress/body-weight'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">{t('progress.title')}</h1>
        <p className="text-gray-400 text-sm md:text-base">{t('progress.subtitle')}</p>
      </div>

      {/* Tabs de Navegação */}
      <div className="flex rounded-lg border border-gray-800 bg-[#151515] p-1">
        <Link
          to="/app/progress"
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition text-center ${
            isOverviewActive
              ? 'bg-primary text-black'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          {t('progress.general', 'Geral')}
        </Link>
        <Link
          to="/app/progress/exercise"
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition text-center ${
            isExerciseActive
              ? 'bg-primary text-black'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          {t('progress.exerciseProgression', 'Por Exercício')}
        </Link>
        <Link
          to="/app/progress/body-weight"
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition text-center ${
            isBodyWeightActive
              ? 'bg-primary text-black'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          {t('progress.bodyWeight', 'Peso Corporal')}
        </Link>
      </div>

      {/* Filtro de Range */}
      <ProgressRangeFilter value={selectedRange} onChange={setSelectedRange} />

      {/* Seção Peso Corporal */}
      <div className="rounded-xl border border-gray-800 bg-[#101010] p-4 md:p-6">
        <MeasurementsCharts
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
        />
      </div>
    </div>
  )
}

