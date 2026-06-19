import { useState, useMemo } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getEvolutionStats, type EvolutionStats } from '@/api/workoutSession'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts'
import { TrendingUp, Download } from 'lucide-react'
import { ProgressRangeFilter } from '@/components/ProgressRangeFilter'
import {
  ProgressTagFilter,
  type ProgressGranularity,
} from '@/components/ProgressTagFilter'
import { ExportWorkoutHistoryModal } from '@/components/ExportWorkoutHistoryModal'
import { ProgressPeriodSummaryCard } from '@/components/ProgressPeriodSummaryCard'
import { OverviewProgressTooltip } from '@/components/OverviewProgressTooltip'
import {
  PROGRESS_CHART_MARGIN,
  ProgressChartGrid,
  ProgressChartLegend,
  progressReferenceLineProps,
  progressTrendLineProps,
} from '@/components/ProgressChartShared'
import type { RangePreset } from '@/utils/dateRange'
import { calculateDateRange } from '@/utils/dateRange'
import {
  buildOverviewChartPointsWithDeltas,
  formatProgressDateLabel,
  getEvolutionBestValue,
} from '@/utils/progressChart'

export default function ProgressOverview() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [viewMode, setViewMode] = useState<'total' | 'byGroup'>('total')
  const [metricMode, setMetricMode] = useState<'volume' | 'sets'>('volume')
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

  const { data: stats, isPending, isFetching, error, refetch } = useQuery<EvolutionStats>({
    queryKey: [
      'evolution-stats',
      dateRange.startDate,
      dateRange.endDate,
      selectedTagId,
      granularity,
    ],
    queryFn: () =>
      getEvolutionStats(dateRange.startDate, dateRange.endDate, statsOptions),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  })

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

  const gapFree = Boolean(selectedTagId)

  const overviewChartData = useMemo(() => {
    if (!stats || viewMode !== 'total') return []

    const rawPoints =
      stats.granularity === 'session'
        ? stats.sessionStats.map((session) => ({
            dateKey: session.sessionDate,
            value: metricMode === 'volume' ? session.volume : session.sets,
          }))
        : stats.weeklyStats.map((week) => ({
            dateKey: week.week,
            value: metricMode === 'volume' ? week.volume : week.sets,
          }))

    const referenceBest = stats.periodSummary
      ? getEvolutionBestValue(stats.periodSummary, metricMode)
      : null

    return buildOverviewChartPointsWithDeltas(rawPoints, i18n.language, {
      gapFree,
      referenceBest,
    })
  }, [stats, viewMode, metricMode, i18n.language, gapFree])

  const chartData = useMemo(() => {
    if (!stats) return []
    if (viewMode === 'total') return overviewChartData

    if (stats.granularity === 'session') {
      return stats.sessionStats.map((session, index) => {
        const data: Record<string, string | number> = {
          label: gapFree
            ? String(index + 1)
            : formatProgressDateLabel(session.sessionDate, i18n.language),
          dateKey: session.sessionDate,
        }

        Object.entries(session.byMuscleGroup).forEach(([muscleGroup, groupData]) => {
          data[muscleGroup] =
            metricMode === 'volume' ? groupData.volume : groupData.sets
        })

        return data
      })
    }

    return stats.weeklyStats.map((week, index) => {
      const data: Record<string, string | number> = {
        label: gapFree
          ? String(index + 1)
          : formatProgressDateLabel(week.week, i18n.language),
        dateKey: week.week,
      }

      Object.entries(week.byMuscleGroup).forEach(([muscleGroup, groupData]) => {
        data[muscleGroup] =
          metricMode === 'volume' ? groupData.volume : groupData.sets
      })

      return data
    })
  }, [stats, viewMode, metricMode, i18n.language, gapFree, overviewChartData])

  const muscleGroups = new Set<string>()
  if (stats?.granularity === 'session') {
    stats.sessionStats.forEach((session) => {
      Object.keys(session.byMuscleGroup).forEach((mg) => muscleGroups.add(mg))
    })
  } else {
    stats?.weeklyStats.forEach((week) => {
      Object.keys(week.byMuscleGroup).forEach((mg) => muscleGroups.add(mg))
    })
  }
  const muscleGroupArray = Array.from(muscleGroups)

  // Cores para grupos musculares
  const muscleGroupColors: { [key: string]: string } = {
    CHEST: '#3B82F6', // Blue
    BACK: '#10B981', // Green
    SHOULDERS: '#F59E0B', // Amber
    LEGS: '#EF4444', // Red
    BICEPS: '#8B5CF6', // Purple
    TRICEPS: '#EC4899', // Pink
    CORE: '#06B6D4', // Cyan
    FULLBODY: '#00E676', // Primary green
  }

  const overviewMetricLabel =
    metricMode === 'volume' ? t('progress.volume') : t('progress.sets')

  const referenceBest =
    stats?.periodSummary && viewMode === 'total'
      ? getEvolutionBestValue(stats.periodSummary, metricMode)
      : null

  const isOverviewActive = location.pathname === '/app/progress'
  const isExerciseActive = location.pathname === '/app/progress/exercise'
  const [showExportModal, setShowExportModal] = useState(false)

  const tabSearch = searchParams.toString()
  const tabSuffix = tabSearch ? `?${tabSearch}` : ''

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold">{t('progress.title')}</h1>
          <p className="text-gray-400 text-sm md:text-base">{t('progress.subtitle')}</p>
        </div>
        
        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-800 bg-[#101010] text-gray-300 hover:text-white hover:border-primary transition"
          title={t('progress.exportHistory')}
        >
          <Download className="w-4 h-4" />
          <span className="text-sm font-medium">{t('progress.export')}</span>
        </button>
      </div>

      {/* Tabs de Navegação */}
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

      {/* Filtros */}
      <div className="flex flex-col lg:flex-row gap-4">
        <ProgressRangeFilter value={selectedRange} onChange={setSelectedRange} />
        <ProgressTagFilter
          selectedTagId={selectedTagId}
          onTagChange={handleTagChange}
          granularity={granularity}
          onGranularityChange={handleGranularityChange}
        />
      </div>

      {/* Seção Volume Semanal */}
      <div className="rounded-xl border border-gray-800 bg-[#101010] p-4 md:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-gray-200">{t('progress.weeklyVolume')}</h2>
        </div>

        {/* Toggles */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Toggle Volume Total vs Por Grupo */}
          <div className="flex rounded-lg border border-gray-800 bg-[#151515] p-1">
            <button
              onClick={() => setViewMode('total')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition ${
                viewMode === 'total'
                  ? 'bg-primary text-black'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {t('progress.totalVolume')}
            </button>
            <button
              onClick={() => setViewMode('byGroup')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition ${
                viewMode === 'byGroup'
                  ? 'bg-primary text-black'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {t('progress.byMuscleGroup')}
            </button>
          </div>

          {/* Toggle Volume vs Séries */}
          <div className="flex rounded-lg border border-gray-800 bg-[#151515] p-1">
            <button
              onClick={() => setMetricMode('volume')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition ${
                metricMode === 'volume'
                  ? 'bg-primary text-black'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {t('progress.volume')}
            </button>
            <button
              onClick={() => setMetricMode('sets')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition ${
                metricMode === 'sets'
                  ? 'bg-primary text-black'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {t('progress.sets')}
            </button>
          </div>
        </div>

        {/* Gráfico */}
        {error ? (
          <div className="space-y-4 text-center py-8">
            <p className="text-gray-400">{t('progress.errorLoading')}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-primary text-dark font-semibold rounded-lg hover:brightness-110 transition"
            >
              {t('common.tryAgain')}
            </button>
          </div>
        ) : isPending ? (
          <div className="h-64 md:h-80 bg-gray-800 rounded-lg animate-pulse" />
        ) : (
          <div className={`relative ${isFetching ? 'opacity-60' : ''}`}>
            {chartData.length > 0 ? (
              <div className="w-full h-64 md:h-80 min-h-[256px]">
                <ResponsiveContainer width="100%" height="100%" minHeight={256}>
                  <LineChart data={chartData} margin={PROGRESS_CHART_MARGIN}>
                    <ProgressChartGrid />
                    <XAxis
                      dataKey="label"
                      stroke="#6B7280"
                      fontSize={11}
                      tick={{ fill: '#9CA3AF' }}
                      tickLine={false}
                      axisLine={{ stroke: '#374151' }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      stroke="#6B7280"
                      fontSize={11}
                      tick={{ fill: '#9CA3AF' }}
                      tickLine={false}
                      axisLine={false}
                      width={40}
                      tickFormatter={(value) =>
                        metricMode === 'volume'
                          ? `${(value / 1000).toFixed(1)}k`
                          : value.toString()
                      }
                    />
                    {viewMode === 'total' ? (
                      <Tooltip
                        content={
                          <OverviewProgressTooltip
                            metricMode={metricMode}
                            metricLabel={overviewMetricLabel}
                            gapFree={gapFree}
                          />
                        }
                      />
                    ) : (
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F3F4F6',
                        }}
                        labelStyle={{ color: '#9CA3AF' }}
                        formatter={(value: number, name: string) => {
                          const formattedValue = metricMode === 'volume'
                            ? `${Math.round(value).toLocaleString(i18n.language === 'pt' ? 'pt-BR' : 'en-US')} ${t('workout.kg')}`
                            : value.toString()
                          return [formattedValue, name]
                        }}
                      />
                    )}
                    <Legend
                      content={
                        <ProgressChartLegend
                          referenceBest={
                            viewMode === 'total' ? referenceBest : null
                          }
                        />
                      }
                    />
                    {viewMode === 'total' &&
                      referenceBest != null &&
                      referenceBest > 0 && (
                        <ReferenceLine
                          {...progressReferenceLineProps(referenceBest)}
                        />
                      )}
                    {viewMode === 'total' ? (
                      <>
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#00E676"
                          strokeWidth={2}
                          dot={{ fill: '#00E676', r: 3 }}
                          activeDot={{ r: 5 }}
                          name={overviewMetricLabel}
                        />
                        {overviewChartData.some((point) => point.trend != null) && (
                          <Line
                            {...progressTrendLineProps(t('progress.trendLine'))}
                          />
                        )}
                      </>
                    ) : (
                      muscleGroupArray.map((mg) => (
                        <Line
                          key={mg}
                          type="monotone"
                          dataKey={mg}
                          stroke={muscleGroupColors[mg] || '#9CA3AF'}
                          strokeWidth={2}
                          dot={{ fill: muscleGroupColors[mg] || '#9CA3AF', r: 3 }}
                          activeDot={{ r: 5 }}
                          name={t(`exercise.${mg.toLowerCase()}`)}
                        />
                      ))
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">{t('progress.noData')}</p>
              </div>
            )}

            {viewMode === 'total' && stats?.periodSummary && (
              <div className="mt-4">
                <ProgressPeriodSummaryCard
                  variant="evolution"
                  summary={stats.periodSummary}
                  metricMode={metricMode}
                  granularity={stats.granularity}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Exportação */}
      <ExportWorkoutHistoryModal
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </div>
  )
}

