import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getSleepStats, type SleepStats } from '@/api/sleep'
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
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

type SleepChartsProps = {
  startDate?: string | null
  endDate?: string | null
}

export function SleepCharts({ startDate = null, endDate = null }: SleepChartsProps = {}) {
  const { t, i18n } = useTranslation()

  const { data: stats, isLoading, error } = useQuery<SleepStats>({
    queryKey: ['sleep-stats', startDate, endDate],
    queryFn: () => getSleepStats(undefined, startDate || undefined, endDate || undefined),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

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

  const formatCurrentDate = (dateString: string | null): string => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString(i18n.language === 'pt' ? 'pt-BR' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const getCurrentValue = () => {
    if (!stats) return null
    return stats.current.sleepHours
  }

  const getAverage = () => {
    if (!stats) return null
    return stats.average
  }

  const getTrend = () => {
    if (!stats) return null
    return stats.trend
  }

  const getWeeklyData = () => {
    if (!stats) return []
    return stats.weeklyData
  }

  const getTrendColor = (direction: 'up' | 'down' | 'stable') => {
    // Para sono: verde = mais horas (up), vermelho = menos horas (down)
    return direction === 'up' ? 'text-green-500' : direction === 'down' ? 'text-red-500' : 'text-gray-400'
  }

  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    if (direction === 'up') return <TrendingUp className="w-5 h-5" />
    if (direction === 'down') return <TrendingDown className="w-5 h-5" />
    return <Minus className="w-5 h-5" />
  }

  if (isLoading) {
    return (
      <div className="bg-[#181818] rounded-xl p-6 border border-gray-800">
        <div className="h-64 bg-gray-800 rounded animate-pulse" />
      </div>
    )
  }

  if (error || !stats) {
    return null
  }

  const weeklyData = getWeeklyData()
  const currentValue = getCurrentValue()
  const trend = getTrend()

  if (weeklyData.length === 0) {
    return (
      <div className="bg-[#181818] rounded-xl p-6 border border-gray-800">
        <p className="text-gray-400 text-center py-8">{t('sleep.noData')}</p>
      </div>
    )
  }

  // Calcular linha de tendência (regressão linear simples)
  const calculateTrendLine = (data: Array<{ value: number }>) => {
    if (data.length < 2) return []
    
    const n = data.length
    let sumX = 0
    let sumY = 0
    let sumXY = 0
    let sumX2 = 0
    
    data.forEach((point, index) => {
      const x = index
      const y = point.value
      sumX += x
      sumY += y
      sumXY += x * y
      sumX2 += x * x
    })
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    
    return data.map((_, index) => ({
      value: slope * index + intercept,
    }))
  }

  const chartData = weeklyData.map((week) => {
    const baseData = {
      week: formatWeek(week.week),
      weekKey: week.week,
      value: week.value,
    }
    return baseData
  })

  const trendLineData = calculateTrendLine(weeklyData.map(w => ({ value: w.value })))
  
  // Adicionar valores da linha de tendência aos dados do gráfico
  const chartDataWithTrend = chartData.map((point, index) => ({
    ...point,
    trend: trendLineData[index]?.value || null,
  }))

  return (
    <div className="bg-[#181818] rounded-xl p-6 border border-gray-800 space-y-6">
      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current Value */}
        <div className="bg-[#101010] rounded-lg p-4 border border-gray-800">
          <div className="text-sm text-gray-400 mb-1">{t('sleep.currentValue')}</div>
          {currentValue !== null ? (
            <>
              <div className="text-2xl font-bold text-gray-100">
                {currentValue} {t('sleep.hours')}
              </div>
              {stats.current.date && (
                <div className="text-xs text-gray-500 mt-1">
                  {formatCurrentDate(stats.current.date)}
                </div>
              )}
            </>
          ) : (
            <div className="text-gray-500 text-sm">{t('sleep.noData')}</div>
          )}
        </div>

        {/* Trend with Average */}
        {trend && weeklyData.length >= 2 && (
          <div className="bg-[#101010] rounded-lg p-4 border border-gray-800">
            <div className="text-sm text-gray-400 mb-1">{t('sleep.lastWeekChange')}</div>
            <div className={`flex items-center gap-2 ${getTrendColor(trend.direction)}`}>
              {getTrendIcon(trend.direction)}
              <div className="text-xl font-bold">
                {trend.change > 0 ? '+' : ''}
                {trend.change} {t('sleep.hours')}
              </div>
            </div>
            <div className={`text-sm mt-1 ${getTrendColor(trend.direction)}`}>
              {trend.changePercent > 0 ? '+' : ''}
              {trend.changePercent}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {t('sleep.weeks')}
            </div>
            
            {/* Average */}
            {(() => {
              const average = getAverage()
              if (average !== null) {
                return (
                  <div className="mt-3 pt-3 border-t border-gray-800">
                    <div className="text-xs text-gray-400 mb-1">{t('sleep.average')}</div>
                    <div className="text-lg font-semibold text-gray-100">
                      {average} {t('sleep.hours')}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {t('sleep.weeksAverage')}
                    </div>
                  </div>
                )
              }
              return null
            })()}
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartDataWithTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="week"
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
              label={{ value: t('sleep.hours'), angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#181818',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F3F4F6',
              }}
              labelStyle={{ color: '#9CA3AF' }}
            />
            <Legend
              wrapperStyle={{ color: '#9CA3AF', fontSize: '12px' }}
              iconType="line"
            />
            {/* Linha de tendência */}
            {weeklyData.length >= 2 && (
              <Line
                type="linear"
                dataKey="trend"
                stroke="#9CA3AF"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={false}
                activeDot={false}
                name={t('sleep.trendLine')}
                strokeOpacity={0.6}
              />
            )}
            {/* Linha de dados reais */}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#00E676"
              strokeWidth={2}
              dot={{ fill: '#00E676', r: 4 }}
              activeDot={{ r: 6 }}
              name={t('sleep.sleepHours')}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

