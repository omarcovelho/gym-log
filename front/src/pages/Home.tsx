import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/AuthContext'
import { getWorkoutStats, type WorkoutStats } from '@/api/workoutSession'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Activity, TrendingUp, Trophy, Calendar } from 'lucide-react'

export default function Home() {
  const { user } = useAuth()
  const { t, i18n } = useTranslation()

  const { data: stats, isLoading, error, refetch } = useQuery<WorkoutStats>({
    queryKey: ['workout-stats'],
    queryFn: getWorkoutStats,
  })

  const formatVolume = (volume: number): string => {
    return `${Math.round(volume).toLocaleString(i18n.language === 'pt' ? 'pt-BR' : 'en-US')} ${t('workout.kg')}`
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString(i18n.language === 'pt' ? 'pt-BR' : 'en-US', { day: '2-digit', month: 'short' })
  }

  // Preparar dados do gráfico
  const chartData = stats?.volumeHistory.map((item) => ({
    date: new Date(item.date).toLocaleDateString(i18n.language === 'pt' ? 'pt-BR' : 'en-US', { day: '2-digit', month: '2-digit' }),
    volume: item.volume,
  })) || []

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-800 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-800 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-gray-800 rounded-lg animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4 text-center py-12">
        <p className="text-gray-400">{t('home.errorLoading')}</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-primary text-dark font-semibold rounded-lg hover:brightness-110 transition"
        >
          {t('common.tryAgain')}
        </button>
      </div>
    )
  }

  const hasData = stats && (stats.totalWorkouts > 0 || stats.lastWorkout)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">{t('home.welcome', { name: user?.name || user?.email?.split('@')[0] || 'User' })}</h1>
        <p className="text-gray-400 text-sm md:text-base">
          {t('home.subtitle')}
        </p>
      </div>

      {!hasData ? (
        /* Empty State */
        <div className="rounded-xl border border-gray-800 bg-[#101010] p-8 text-center space-y-4">
          <Activity className="w-12 h-12 text-gray-600 mx-auto" />
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-200">{t('home.noWorkouts')}</h2>
            <p className="text-gray-400 text-sm">
              {t('home.noWorkoutsDescription')}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Cards de Estatísticas - Mobile First */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Card: Total de Treinos */}
            <div className="rounded-xl border border-gray-800 bg-[#101010] p-4 md:p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div className="text-sm text-gray-400">{t('home.totalWorkouts')}</div>
              </div>
              <div className="text-3xl md:text-4xl font-bold text-gray-100">
                {stats?.totalWorkouts || 0}
              </div>
              <div className="text-xs text-gray-500 mt-1">{t('home.last30Days')}</div>
            </div>

            {/* Card: Volume do Mês */}
            <div className="rounded-xl border border-gray-800 bg-[#101010] p-4 md:p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div className="text-sm text-gray-400">{t('home.monthlyVolume')}</div>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-primary">
                {stats?.monthlyVolume ? formatVolume(stats.monthlyVolume) : `0 ${t('workout.kg')}`}
              </div>
              <div className="text-xs text-gray-500 mt-1">{t('home.currentMonth')}</div>
            </div>

            {/* Card: PRs Recentes */}
            <div className="rounded-xl border border-gray-800 bg-[#101010] p-4 md:p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div className="text-sm text-gray-400">{t('home.recentPRs')}</div>
              </div>
              {stats?.recentPRs && stats.recentPRs.length > 0 ? (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {stats.recentPRs.map((pr, idx) => (
                    <div key={idx} className="text-sm">
                      <div className="text-gray-200 font-medium">{pr.exerciseName}</div>
                      <div className="text-gray-400 text-xs">
                        {pr.type === 'load' ? t('home.load') : pr.type === 'reps' ? t('home.reps') : t('home.volume')}:{' '}
                        <span className="text-primary font-semibold">
                          {pr.value.toLocaleString(i18n.language === 'pt' ? 'pt-BR' : 'en-US')} {pr.unit || ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">{t('home.noRecentPRs')}</div>
              )}
            </div>

            {/* Card: Último Treino */}
            {stats?.lastWorkout && (
              <Link
                to={`/app/workouts/${stats.lastWorkout.id}/view`}
                className="rounded-xl border border-gray-800 bg-[#101010] p-4 md:p-6 hover:border-primary/50 transition cursor-pointer block"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-sm text-gray-400">{t('home.lastWorkout')}</div>
                </div>
                <div className="text-lg font-semibold text-gray-100 mb-1">
                  {stats.lastWorkout.title}
                </div>
                <div className="text-sm text-gray-400 mb-2">
                  {formatDate(stats.lastWorkout.date)}
                </div>
                <div className="text-sm text-primary font-medium">
                  {formatVolume(stats.lastWorkout.volume)}
                </div>
              </Link>
            )}
          </div>

          {/* Gráfico de Volume */}
          {chartData.length > 0 && (
            <div className="rounded-xl border border-gray-800 bg-[#101010] p-4 md:p-6">
              <h2 className="text-lg font-semibold text-gray-200 mb-4">{t('home.volumeChart')}</h2>
              <div className="w-full h-48 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="date"
                      stroke="#9CA3AF"
                      fontSize={12}
                      tick={{ fill: '#9CA3AF' }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      stroke="#9CA3AF"
                      fontSize={12}
                      tick={{ fill: '#9CA3AF' }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F3F4F6',
                      }}
                      labelStyle={{ color: '#9CA3AF' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="volume"
                      stroke="#00E676"
                      strokeWidth={2}
                      dot={{ fill: '#00E676', r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Links Rápidos Secundários */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <Link
              to="/app/templates"
              className="px-4 py-3 border border-gray-700 text-gray-200 font-semibold rounded-lg hover:border-primary hover:text-primary transition flex items-center justify-center gap-2 min-h-[44px] text-sm md:text-base"
            >
              {t('home.viewTemplates')}
            </Link>
            <Link
              to="/app/workouts"
              className="px-4 py-3 border border-gray-700 text-gray-200 font-semibold rounded-lg hover:border-primary hover:text-primary transition flex items-center justify-center gap-2 min-h-[44px] text-sm md:text-base"
            >
              {t('home.viewHistory')}
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
