import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
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
import { TrendingUp, TrendingDown, Minus, Pin, X } from 'lucide-react'
import { useExercises, type Exercise } from '@/api/exercise'
import { getExerciseProgression, type ExerciseProgression } from '@/api/workoutSession'
import { ExercisePickerModal } from './ExercisePickerModal'
import { usePinnedExercises } from '@/hooks/usePinnedExercises'
import { useToast } from './ToastProvider'

type Props = {
  startDate: string | null
  endDate: string | null
}

type ExerciseChartCardProps = {
  exerciseId: string
  exercise: Exercise
  startDate: string | null
  endDate: string | null
  onUnpin: (exerciseId: string) => void
  isPinned: boolean
}

function ExerciseChartCard({
  exerciseId,
  exercise,
  startDate,
  endDate,
  onUnpin,
  isPinned,
}: ExerciseChartCardProps) {
  const { t, i18n } = useTranslation()
  const [metricMode, setMetricMode] = useState<'load' | 'volume'>('load')

  const { data: progression, isLoading, error } = useQuery<ExerciseProgression>({
    queryKey: ['exercise-progression', exerciseId, startDate, endDate],
    queryFn: () => getExerciseProgression(exerciseId, startDate, endDate),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const formatWeek = (weekKey: string): string => {
    const match = weekKey.match(/(\d{4})-(\d{2})-(\d{2})/)
    if (match) {
      const [, yearStr, monthStr, dayStr] = match
      const year = parseInt(yearStr, 10)
      const month = parseInt(monthStr, 10) - 1
      const day = parseInt(dayStr, 10)

      const weekMonday = new Date(year, month, day)

      return weekMonday.toLocaleDateString(i18n.language === 'pt' ? 'pt-BR' : 'en-US', {
        day: '2-digit',
        month: 'short',
      })
    }
    return weekKey
  }

  const chartData = progression?.weeks.map((week) => ({
    week: formatWeek(week.week),
    weekKey: week.week,
    avgLoad: week.avgLoad,
    totalVolume: week.totalVolume,
  })) || []

  return (
    <div className="rounded-xl border border-gray-800 bg-[#101010] p-4 md:p-6 space-y-4">
      {/* Header com nome e botão unpin */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-200">{exercise.name}</h3>
        {isPinned && (
          <button
            type="button"
            onClick={() => onUnpin(exerciseId)}
            className="p-2 rounded hover:bg-gray-800/60 transition text-gray-400 hover:text-red-400"
            title={t('progress.unpinChart', 'Remover gráfico')}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {isLoading && (
        <div className="text-center py-8">
          <div className="h-64 bg-gray-800 rounded-lg animate-pulse" />
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">{t('progress.errorLoading', 'Erro ao carregar dados')}</p>
        </div>
      )}

      {!isLoading && !error && (!progression || progression.weeks.length === 0) && (
        <div className="text-center py-8">
          <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">
            {t('progress.noExerciseData', 'Nenhum dado disponível para este exercício no período selecionado')}
          </p>
        </div>
      )}

      {!isLoading && !error && progression && progression.weeks.length > 0 && (
        <>
          {/* Toggle de métrica */}
          <div className="flex rounded-lg border border-gray-800 bg-[#151515] p-1 w-fit">
            <button
              onClick={() => setMetricMode('load')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                metricMode === 'load'
                  ? 'bg-primary text-black'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {t('progress.avgLoad', 'Carga Média')}
            </button>
            <button
              onClick={() => setMetricMode('volume')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                metricMode === 'volume'
                  ? 'bg-primary text-black'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {t('progress.totalVolume', 'Volume Total')}
            </button>
          </div>

          {/* Gráfico */}
          {chartData.length > 0 && (
            <div className="w-full h-64 md:h-80 min-h-[256px]">
              <ResponsiveContainer width="100%" height="100%" minHeight={256}>
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
                        : `${value.toFixed(1)}`
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
                    formatter={(value: number) => {
                      const formattedValue = metricMode === 'volume'
                        ? `${Math.round(value).toLocaleString(i18n.language === 'pt' ? 'pt-BR' : 'en-US')} ${t('workout.kg', 'kg')}`
                        : `${value.toFixed(1)} ${t('workout.kg', 'kg')}`
                      return formattedValue
                    }}
                  />
                  <Legend
                    wrapperStyle={{ color: '#9CA3AF', fontSize: '12px' }}
                    iconType="line"
                  />
                  <Line
                    type="monotone"
                    dataKey={metricMode === 'volume' ? 'totalVolume' : 'avgLoad'}
                    stroke="#00E676"
                    strokeWidth={2}
                    dot={{ fill: '#00E676', r: 3 }}
                    activeDot={{ r: 5 }}
                    name={metricMode === 'volume' ? t('progress.totalVolume', 'Volume Total') : t('progress.avgLoad', 'Carga Média')}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Cards de comparação */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Esta semana vs semana anterior */}
            {progression.currentWeek && progression.previousWeek && (
              <div className="rounded-lg border border-gray-800 bg-[#151515] p-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">
                  {t('progress.thisWeek', 'Esta semana')} vs {t('progress.lastWeek', 'Semana anterior')}
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">{t('progress.avgLoad', 'Carga Média')}:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-200">
                        {progression.currentWeek.avgLoad.toFixed(1)} → {progression.previousWeek.avgLoad.toFixed(1)} {t('workout.kg', 'kg')}
                      </span>
                      {progression.currentWeek.avgLoad > progression.previousWeek.avgLoad ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : progression.currentWeek.avgLoad < progression.previousWeek.avgLoad ? (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      ) : (
                        <Minus className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">{t('progress.totalVolume', 'Volume Total')}:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-200">
                        {Math.round(progression.currentWeek.totalVolume).toLocaleString(i18n.language === 'pt' ? 'pt-BR' : 'en-US')} → {Math.round(progression.previousWeek.totalVolume).toLocaleString(i18n.language === 'pt' ? 'pt-BR' : 'en-US')} {t('workout.kg', 'kg')}
                      </span>
                      {progression.currentWeek.totalVolume > progression.previousWeek.totalVolume ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : progression.currentWeek.totalVolume < progression.previousWeek.totalVolume ? (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      ) : (
                        <Minus className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Média 4 semanas */}
            {progression.avgLast4Weeks && progression.avgPrevious4Weeks && (
              <div className="rounded-lg border border-gray-800 bg-[#151515] p-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">
                  {t('progress.avgLast4Weeks', 'Média últimas 4 semanas')} vs {t('progress.avgPrevious4Weeks', 'Média 4 semanas anteriores')}
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">{t('progress.avgLoad', 'Carga Média')}:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-200">
                        {progression.avgLast4Weeks.avgLoad.toFixed(1)} → {progression.avgPrevious4Weeks.avgLoad.toFixed(1)} {t('workout.kg', 'kg')}
                      </span>
                      {progression.avgLast4Weeks.avgLoad > progression.avgPrevious4Weeks.avgLoad ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : progression.avgLast4Weeks.avgLoad < progression.avgPrevious4Weeks.avgLoad ? (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      ) : (
                        <Minus className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">{t('progress.totalVolume', 'Volume Total')}:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-200">
                        {Math.round(progression.avgLast4Weeks.totalVolume).toLocaleString(i18n.language === 'pt' ? 'pt-BR' : 'en-US')} → {Math.round(progression.avgPrevious4Weeks.totalVolume).toLocaleString(i18n.language === 'pt' ? 'pt-BR' : 'en-US')} {t('workout.kg', 'kg')}
                      </span>
                      {progression.avgLast4Weeks.totalVolume > progression.avgPrevious4Weeks.totalVolume ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : progression.avgLast4Weeks.totalVolume < progression.avgPrevious4Weeks.totalVolume ? (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      ) : (
                        <Minus className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export function ExerciseProgressionChart({ startDate, endDate }: Props) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { pinnedExerciseIds, pinExercise, unpinExercise, isPinned } = usePinnedExercises()
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  const { data: exercisesData } = useExercises({ page: 1, limit: 1000 })
  const exercises = exercisesData?.data ?? []

  const selectedExercise = selectedExerciseId ? exercises.find((e) => e.id === selectedExerciseId) : null
  const isSelectedPinned = selectedExerciseId ? isPinned(selectedExerciseId) : false

  // Sempre mostrar seletor (mesmo com 5 pinados, para permitir visualizar outros exercícios)
  // Mas só permitir pinar se há menos de 5 pinados OU se o exercício já está pinado
  const canPinSelected = pinnedExerciseIds.length < 5 || isSelectedPinned

  const handlePin = async () => {
    if (!selectedExerciseId) return

    // Verificar limite - mesmo se o botão estiver desabilitado, verificar novamente
    if (pinnedExerciseIds.length >= 5 && !isSelectedPinned) {
      toast({
        variant: 'error',
        title: t('progress.pinnedExerciseLimitTitle', 'Limite de favoritos atingido'),
        description: t('progress.pinnedExerciseLimitReached', 'Você pode ter no máximo 5 exercícios favoritos. Remova um exercício para adicionar outro.'),
      })
      return
    }

    try {
      await pinExercise(selectedExerciseId)
      toast({
        variant: 'success',
        title: t('progress.pinChart', 'Gráfico favoritado'),
        description: `${selectedExercise?.name} foi adicionado aos favoritos`,
      })
      setSelectedExerciseId(null) // Limpar seleção para mostrar novo seletor
    } catch (err: any) {
      // Se o erro for de limite, mostrar mensagem específica
      const errorMessage = err?.response?.data?.message || err?.message || ''
      if (errorMessage.includes('Maximum') || errorMessage.includes('limite') || errorMessage.includes('limit')) {
        toast({
          variant: 'error',
          title: t('progress.pinnedExerciseLimitTitle', 'Limite de favoritos atingido'),
          description: t('progress.pinnedExerciseLimitReached', 'Você pode ter no máximo 5 exercícios favoritos. Remova um exercício para adicionar outro.'),
        })
      } else {
        toast({
          variant: 'error',
          title: t('progress.error', 'Erro'),
          description: errorMessage || 'Erro ao favoritar gráfico',
        })
      }
    }
  }

  const handleUnpin = async (exerciseId: string) => {
    try {
      await unpinExercise(exerciseId)
      // Se o exercício desfavoritado estava selecionado, limpar a seleção
      if (selectedExerciseId === exerciseId) {
        setSelectedExerciseId(null)
      }
      toast({
        variant: 'success',
        title: t('progress.unpinChart', 'Gráfico removido'),
        description: t('progress.unpinChartDescription', 'Gráfico removido dos favoritos'),
      })
    } catch (err: any) {
      toast({
        variant: 'error',
        title: t('progress.error', 'Erro'),
        description: err?.response?.data?.message || err?.message || t('progress.errorLoading', 'Erro ao remover gráfico'),
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Gráficos Pinados */}
      {pinnedExerciseIds.map((exerciseId) => {
        const exercise = exercises.find((e) => e.id === exerciseId)
        if (!exercise) return null

        return (
          <ExerciseChartCard
            key={exerciseId}
            exerciseId={exerciseId}
            exercise={exercise}
            startDate={startDate}
            endDate={endDate}
            onUnpin={handleUnpin}
            isPinned={true}
          />
        )
      })}

      {/* Seletor de Novo Exercício - Sempre visível */}
      <div className="rounded-xl border border-gray-800 bg-[#101010] p-4 md:p-6 space-y-4">
        {!selectedExerciseId ? (
          <>
            <h3 className="text-lg font-semibold text-gray-200">
              {t('progress.selectNewExercise', 'Selecionar novo exercício')}
            </h3>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="w-full flex justify-between items-center border rounded-lg px-4 py-2 bg-[#151515] text-sm font-medium transition border-gray-800 text-gray-200 hover:border-primary hover:text-primary"
            >
              <div className="flex items-center gap-2">
                <span>🏋️</span>
                {t('progress.selectExercise', 'Selecione um exercício')}
              </div>
              <span className="text-xs text-gray-500">▼</span>
            </button>
          </>
        ) : (
          <>
            {/* Header com nome, botão de trocar exercício e botão pin */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-200">{selectedExercise?.name}</h3>
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="text-xs text-gray-400 hover:text-gray-200 px-2 py-1 rounded border border-gray-700 hover:border-gray-600 transition"
                  title={t('progress.selectNewExercise', 'Trocar exercício')}
                >
                  {t('progress.selectNewExercise', 'Trocar')}
                </button>
              </div>
              <button
                type="button"
                onClick={handlePin}
                className={`
                  p-2 rounded-lg transition
                  ${
                    !canPinSelected
                      ? 'text-gray-500 opacity-50 hover:bg-gray-800/60 cursor-not-allowed'
                      : 'text-primary hover:bg-primary/10 hover:text-primary'
                  }
                `}
                title={
                  !canPinSelected
                    ? t('progress.pinnedExerciseLimitReached', 'Você pode ter no máximo 5 exercícios favoritos. Remova um exercício para adicionar outro.')
                    : t('progress.pinChart', 'Favoritar gráfico')
                }
              >
                <Pin className="w-5 h-5" />
              </button>
            </div>

            {/* Gráfico do exercício selecionado */}
            <ExerciseChartCard
              exerciseId={selectedExerciseId}
              exercise={selectedExercise!}
              startDate={startDate}
              endDate={endDate}
              onUnpin={() => setSelectedExerciseId(null)}
              isPinned={false}
            />
          </>
        )}

        <ExercisePickerModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={(id) => {
            // Só permitir selecionar se não está pinado
            if (!pinnedExerciseIds.includes(id)) {
              setSelectedExerciseId(id)
            }
            setPickerOpen(false)
          }}
          exercises={exercises.filter((e) => !isPinned(e.id))}
        />
      </div>
    </div>
  )
}
