import { useMemo, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ProgressRangeFilter } from '@/components/ProgressRangeFilter'
import {
  ProgressTagFilter,
  type ProgressGranularity,
} from '@/components/ProgressTagFilter'
import { ExerciseProgressionChart } from '@/components/ExerciseProgressionChart'
import type { RangePreset } from '@/utils/dateRange'
import { calculateDateRange } from '@/utils/dateRange'

export default function ProgressExercise() {
  const { t } = useTranslation()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedRange, setSelectedRange] = useState<RangePreset>('4weeks')

  const selectedTagId = searchParams.get('tagIds') || null
  const granularity = (searchParams.get('granularity') === 'session'
    ? 'session'
    : 'week') as ProgressGranularity

  const dateRange = useMemo(() => calculateDateRange(selectedRange), [selectedRange])

  const statsOptions = useMemo(
    () => ({
      tagIds: selectedTagId ? [selectedTagId] : undefined,
      granularity,
    }),
    [selectedTagId, granularity],
  )

  function handleTagChange(tagId: string | null) {
    const params = new URLSearchParams(searchParams)
    if (tagId) params.set('tagIds', tagId)
    else params.delete('tagIds')
    setSearchParams(params)
  }

  function handleGranularityChange(next: ProgressGranularity) {
    const params = new URLSearchParams(searchParams)
    if (next === 'session') params.set('granularity', 'session')
    else params.delete('granularity')
    setSearchParams(params)
  }

  const isOverviewActive = location.pathname === '/app/progress'
  const isExerciseActive = location.pathname === '/app/progress/exercise'

  const tabSearch = searchParams.toString()
  const tabSuffix = tabSearch ? `?${tabSearch}` : ''

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">{t('progress.title')}</h1>
        <p className="text-gray-400 text-sm md:text-base">{t('progress.subtitle')}</p>
      </div>

      <div className="flex w-full sm:w-fit rounded-lg border border-gray-800 bg-[#151515] p-1">
        <Link
          to={`/app/progress${tabSuffix}`}
          className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition text-center ${
            isOverviewActive
              ? 'bg-primary text-black'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          {t('progress.general', 'Geral')}
        </Link>
        <Link
          to={`/app/progress/exercise${tabSuffix}`}
          className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition text-center ${
            isExerciseActive
              ? 'bg-primary text-black'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          {t('progress.exerciseProgression', 'Por Exercício')}
        </Link>
        <Link
          to={`/app/progress/body-weight${tabSuffix}`}
          className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition text-center ${
            location.pathname === '/app/progress/body-weight'
              ? 'bg-primary text-black'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          {t('progress.bodyWeight', 'Peso Corporal')}
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <ProgressRangeFilter value={selectedRange} onChange={setSelectedRange} />
        <ProgressTagFilter
          selectedTagId={selectedTagId}
          onTagChange={handleTagChange}
          granularity={granularity}
          onGranularityChange={handleGranularityChange}
        />
      </div>

      <div className="rounded-xl border border-gray-800 bg-[#101010] p-4 md:p-6">
        <ExerciseProgressionChart
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          statsOptions={statsOptions}
        />
      </div>
    </div>
  )
}
