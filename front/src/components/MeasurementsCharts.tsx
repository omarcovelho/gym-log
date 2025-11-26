import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getMeasurementsStats, type MeasurementsStats } from '@/api/bodyMeasurement'
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

type MeasurementType = 'weight' | 'waist' | 'arm'

export function MeasurementsCharts() {
  const { t, i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState<MeasurementType>('weight')

  const { data: stats, isLoading, error } = useQuery<MeasurementsStats>({
    queryKey: ['measurements-stats'],
    queryFn: () => getMeasurementsStats(8),
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
    return stats.current[activeTab]
  }

  const getAverage = () => {
    if (!stats) return null
    return stats.averages[activeTab]
  }

  const getTrend = () => {
    if (!stats) return null
    return stats.trends[activeTab]
  }

  const getWeeklyData = () => {
    if (!stats) return []
    return stats.weeklyData[activeTab]
  }

  const getUnit = () => {
    return activeTab === 'weight' ? t('measurements.kg') : 'cm'
  }

  const getLabel = () => {
    switch (activeTab) {
      case 'weight':
        return t('measurements.weight')
      case 'waist':
        return t('measurements.waist')
      case 'arm':
        return t('measurements.arm')
    }
  }

  const getTrendColor = (direction: 'up' | 'down' | 'stable') => {
    // Para peso: verde = perda (down), vermelho = ganho (up)
    // Para cintura/braço: verde = redução (down), vermelho = aumento (up)
    if (activeTab === 'weight') {
      return direction === 'down' ? 'text-green-500' : direction === 'up' ? 'text-red-500' : 'text-gray-400'
    } else {
      return direction === 'down' ? 'text-green-500' : direction === 'up' ? 'text-red-500' : 'text-gray-400'
    }
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
        <p className="text-gray-400 text-center py-8">{t('measurements.noData')}</p>
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

  const chartData = weeklyData.map((week, index) => {
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
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800">
        {(['weight', 'waist', 'arm'] as MeasurementType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              px-4 py-2 font-medium text-sm transition
              ${
                activeTab === tab
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-400 hover:text-gray-200'
              }
            `}
          >
            {tab === 'weight' && t('measurements.weight')}
            {tab === 'waist' && t('measurements.waist')}
            {tab === 'arm' && t('measurements.arm')}
          </button>
        ))}
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current Value */}
        <div className="bg-[#101010] rounded-lg p-4 border border-gray-800">
          <div className="text-sm text-gray-400 mb-1">{t('measurements.currentValue')}</div>
          {currentValue !== null ? (
            <>
              <div className="text-2xl font-bold text-gray-100">
                {currentValue} {getUnit()}
              </div>
              {stats.current.date && (
                <div className="text-xs text-gray-500 mt-1">
                  {formatCurrentDate(stats.current.date)}
                </div>
              )}
            </>
          ) : (
            <div className="text-gray-500 text-sm">{t('measurements.noData')}</div>
          )}
        </div>

        {/* Trend with Average */}
        {trend && weeklyData.length >= 2 && (
          <div className="bg-[#101010] rounded-lg p-4 border border-gray-800">
            <div className="text-sm text-gray-400 mb-1">{t('measurements.lastWeekChange')}</div>
            <div className={`flex items-center gap-2 ${getTrendColor(trend.direction)}`}>
              {getTrendIcon(trend.direction)}
              <div className="text-xl font-bold">
                {trend.change > 0 ? '+' : ''}
                {trend.change} {getUnit()}
              </div>
            </div>
            <div className={`text-sm mt-1 ${getTrendColor(trend.direction)}`}>
              {trend.changePercent > 0 ? '+' : ''}
              {trend.changePercent}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {t('measurements.weeks')}
            </div>
            
            {/* Average */}
            {(() => {
              const average = getAverage()
              if (average !== null) {
                return (
                  <div className="mt-3 pt-3 border-t border-gray-800">
                    <div className="text-xs text-gray-400 mb-1">{t('measurements.average')}</div>
                    <div className="text-lg font-semibold text-gray-100">
                      {average} {getUnit()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {t('measurements.weeksAverage')}
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
              label={{ value: getUnit(), angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
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
                name={t('measurements.trendLine')}
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
              name={getLabel()}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

