import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getEvolutionStats, type EvolutionStats } from '@/api/workoutSession'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Trophy, TrendingUp } from 'lucide-react'

export default function Progress() {
  const { t, i18n } = useTranslation()
  const [viewMode, setViewMode] = useState<'total' | 'byGroup'>('total')
  const [metricMode, setMetricMode] = useState<'volume' | 'sets'>('volume')

  const { data: stats, isLoading, error, refetch } = useQuery<EvolutionStats>({
    queryKey: ['evolution-stats'],
    queryFn: () => getEvolutionStats(4),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString(i18n.language === 'pt' ? 'pt-BR' : 'en-US', {
      day: '2-digit',
      month: 'short',
    })
  }

  const formatWeek = (weekKey: string): string => {
    // weekKey format: "2024-11-24" (data da segunda-feira da semana)
    const match = weekKey.match(/(\d{4})-(\d{2})-(\d{2})/)
    if (match) {
      const [, yearStr, monthStr, dayStr] = match
      const year = parseInt(yearStr, 10)
      const month = parseInt(monthStr, 10) - 1 // JavaScript months are 0-indexed
      const day = parseInt(dayStr, 10)
      
      const weekMonday = new Date(year, month, day)
      
      // Formatar como "DD/MMM" (ex: "24/Nov")
      return weekMonday.toLocaleDateString(i18n.language === 'pt' ? 'pt-BR' : 'en-US', {
        day: '2-digit',
        month: 'short',
      })
    }
    return weekKey
  }

  // Preparar dados do gráfico
  const chartData = stats?.weeklyStats.map((week) => {
    const data: any = {
      week: formatWeek(week.week),
      weekKey: week.week,
    }

    if (viewMode === 'total') {
      data.value = metricMode === 'volume' ? week.volume : week.sets
    } else {
      // Por grupo muscular
      Object.entries(week.byMuscleGroup).forEach(([muscleGroup, groupData]) => {
        data[muscleGroup] = metricMode === 'volume' ? groupData.volume : groupData.sets
      })
    }

    return data
  }) || []

  // Obter todos os grupos musculares únicos para o gráfico
  const muscleGroups = new Set<string>()
  stats?.weeklyStats.forEach((week) => {
    Object.keys(week.byMuscleGroup).forEach((mg) => muscleGroups.add(mg))
  })
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-800 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-800 rounded animate-pulse" />
        </div>
        <div className="h-64 bg-gray-800 rounded-lg animate-pulse" />
        <div className="h-64 bg-gray-800 rounded-lg animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4 text-center py-12">
        <p className="text-gray-400">{t('progress.errorLoading')}</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-primary text-dark font-semibold rounded-lg hover:brightness-110 transition"
        >
          {t('common.tryAgain')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">{t('progress.title')}</h1>
        <p className="text-gray-400 text-sm md:text-base">{t('progress.subtitle')}</p>
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
        {chartData.length > 0 ? (
          <div className="w-full h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="week"
                  stroke="#9CA3AF"
                  fontSize={12}
                  tick={{ fill: '#9CA3AF' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="#9CA3AF"
                  fontSize={12}
                  tick={{ fill: '#9CA3AF' }}
                  tickFormatter={(value) =>
                    metricMode === 'volume'
                      ? `${(value / 1000).toFixed(1)}k`
                      : value.toString()
                  }
                />
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
                <Legend
                  wrapperStyle={{ color: '#9CA3AF', fontSize: '12px' }}
                  iconType="line"
                />
                {viewMode === 'total' ? (
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#00E676"
                    strokeWidth={2}
                    dot={{ fill: '#00E676', r: 3 }}
                    activeDot={{ r: 5 }}
                    name={metricMode === 'volume' ? t('progress.volume') : t('progress.sets')}
                  />
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
      </div>

      {/* Seção PRs */}
      <div className="rounded-xl border border-gray-800 bg-[#101010] p-4 md:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-gray-200">{t('progress.recentPRs')}</h2>
        </div>

        {stats?.recentPRs && stats.recentPRs.length > 0 ? (
          <div className="space-y-3">
            {stats.recentPRs.map((pr, idx) => (
              <Link
                key={idx}
                to={`/app/workouts/${pr.workoutId}/view`}
                className="block rounded-lg border border-gray-800 bg-[#151515] p-4 hover:border-primary/50 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-lg font-semibold text-gray-100 mb-1">
                      {pr.exerciseName}
                    </div>
                    <div className="text-sm text-gray-400">
                      {t('progress.load')}:{' '}
                      <span className="text-primary font-semibold">
                        {pr.value.toLocaleString(i18n.language === 'pt' ? 'pt-BR' : 'en-US')}{' '}
                        {pr.unit}
                      </span>
                    </div>
                    {pr.previousValue !== pr.value && (
                      <div className="text-xs text-gray-500 mt-1">
                        {t('progress.previous')}: {pr.previousValue.toLocaleString(i18n.language === 'pt' ? 'pt-BR' : 'en-US')} {pr.unit}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    {formatDate(pr.date)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">{t('progress.noPRs')}</p>
          </div>
        )}
      </div>
    </div>
  )
}

