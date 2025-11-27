import { useState, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { TrendingUp } from 'lucide-react'
import { ProgressRangeFilter } from '@/components/ProgressRangeFilter'
import { ExerciseProgressionChart } from '@/components/ExerciseProgressionChart'
import type { RangePreset } from '@/utils/dateRange'
import { calculateDateRange } from '@/utils/dateRange'

export default function ProgressExercise() {
  const { t } = useTranslation()
  const location = useLocation()
  const [selectedRange, setSelectedRange] = useState<RangePreset>('4weeks')
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null)

  // Calcular dates do range selecionado
  const dateRange = useMemo(() => calculateDateRange(selectedRange), [selectedRange])

  const isOverviewActive = location.pathname === '/app/progress'
  const isExerciseActive = location.pathname === '/app/progress/exercise'

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
          {t('progress.overview', 'Visão Geral')}
        </Link>
        <Link
          to="/app/progress/exercise"
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition text-center ${
            isExerciseActive
              ? 'bg-primary text-black'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          {t('progress.exerciseProgression', 'Evolução por Exercício')}
        </Link>
      </div>

      {/* Filtro de Range */}
      <ProgressRangeFilter value={selectedRange} onChange={setSelectedRange} />

      {/* Seção Evolução por Exercício */}
      <div className="rounded-xl border border-gray-800 bg-[#101010] p-4 md:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-gray-200">
            {t('progress.exerciseProgression', 'Evolução por Exercício')}
          </h2>
        </div>
        <ExerciseProgressionChart
          exerciseId={selectedExerciseId}
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onExerciseChange={setSelectedExerciseId}
        />
      </div>
    </div>
  )
}

