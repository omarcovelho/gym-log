import { useState, useMemo } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
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
import { TrendingUp, Pin, X } from 'lucide-react'
import { useExercises, type Exercise } from '@/api/exercise'
import { getExerciseProgression, type ExerciseProgression, type ProgressStatsOptions } from '@/api/workoutSession'
import { ExercisePickerModal } from './ExercisePickerModal'
import { ProgressPeriodSummaryCard } from './ProgressPeriodSummaryCard'
import { ProgressChartTooltip } from './ProgressChartTooltip'
import {
  PROGRESS_CHART_MARGIN,
  ProgressChartGrid,
  ProgressChartLegend,
  progressReferenceLineProps,
  progressTrendLineProps,
} from './ProgressChartShared'
import { usePinnedExercises } from '@/hooks/usePinnedExercises'
import { useToast } from './ToastProvider'
import { buildChartPointsWithDeltas, getExerciseBestValue } from '@/utils/progressChart'

type Props = {
  startDate: string | null
  endDate: string | null
  statsOptions?: ProgressStatsOptions
}

type ExerciseChartCardProps = {
  exerciseId: string
  exercise: Exercise
  startDate: string | null
  endDate: string | null
  statsOptions?: ProgressStatsOptions
  onUnpin: (exerciseId: string) => void
  isPinned: boolean
}

function ExerciseChartCard({
  exerciseId,
  exercise,
  startDate,
  endDate,
  statsOptions,
  onUnpin,
  isPinned,
}: ExerciseChartCardProps) {
  const { t, i18n } = useTranslation()
  const [metricMode, setMetricMode] = useState<'load' | 'volume' | 'e1rm'>('load')

  const { data: progression, isPending, isFetching, error } = useQuery<ExerciseProgression>({
    queryKey: [
      'exercise-progression',
      exerciseId,
      startDate,
      endDate,
      statsOptions?.tagIds,
      statsOptions?.granularity,
    ],
    queryFn: () =>
      getExerciseProgression(exerciseId, startDate, endDate, statsOptions),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  })

  const progressionPoints =
    progression?.granularity === 'session'
      ? progression.sessions
      : progression?.weeks ?? []

  const rawPoints = useMemo(
    () =>
      progressionPoints.map((point) => {
        const dateKey = 'week' in point ? point.week : point.sessionDate
        return {
          dateKey,
          avgLoad: point.avgLoad,
          totalVolume: point.totalVolume,
          bestEstimated1RM: point.bestEstimated1RM ?? 0,
        }
      }),
    [progressionPoints],
  )

  const gapFree = Boolean(statsOptions?.tagIds?.length)

  const referenceBest = progression?.periodSummary
    ? getExerciseBestValue(progression.periodSummary, metricMode)
    : null

  const chartData = useMemo(
    () =>
      buildChartPointsWithDeltas(rawPoints, metricMode, i18n.language, {
        gapFree,
        referenceBest,
      }),
    [rawPoints, metricMode, i18n.language, gapFree, referenceBest],
  )

  const metricLabel =
    metricMode === 'volume'
      ? t('progress.totalVolume')
      : metricMode === 'e1rm'
        ? t('progress.estimated1RM')
        : t('progress.avgLoad')

  const has1RMData =
    progressionPoints.some((point) => (point.bestEstimated1RM ?? 0) > 0) ?? false

  const hasData = progressionPoints.length > 0

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

      {isPending && (
        <div className="text-center py-8">
          <div className="h-64 bg-gray-800 rounded-lg animate-pulse" />
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">{t('progress.errorLoading', 'Erro ao carregar dados')}</p>
        </div>
      )}

      {!isPending && !error && (!progression || !hasData) && (
        <div className="text-center py-8">
          <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">
            {t('progress.noExerciseData', 'Nenhum dado disponível para este exercício no período selecionado')}
          </p>
        </div>
      )}

      {!isPending && !error && progression && hasData && (
        <>
          {/* Toggle de métrica */}
          <div className={`space-y-4 ${isFetching ? 'opacity-60' : ''}`}>
          <div className="flex flex-wrap rounded-lg border border-gray-800 bg-[#151515] p-1 w-fit gap-1">
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
            <button
              onClick={() => setMetricMode('e1rm')}
              disabled={!has1RMData}
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                metricMode === 'e1rm'
                  ? 'bg-primary text-black'
                  : !has1RMData
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'text-gray-400 hover:text-gray-200'
              }`}
              title={!has1RMData ? t('progress.no1RMData') : undefined}
            >
              {t('progress.estimated1RM', 'Est. 1RM')}
            </button>
          </div>

          {metricMode === 'e1rm' && !has1RMData && (
            <p className="text-sm text-gray-500">{t('progress.no1RMData')}</p>
          )}

          {/* Gráfico */}
          {chartData.length > 0 && (metricMode !== 'e1rm' || has1RMData) && (
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
                        : `${value.toFixed(1)}`
                    }
                  />
                  <Tooltip
                    content={
                      <ProgressChartTooltip
                        metricMode={metricMode}
                        metricLabel={metricLabel}
                        gapFree={gapFree}
                      />
                    }
                  />
                  <Legend
                    content={
                      <ProgressChartLegend referenceBest={referenceBest} />
                    }
                  />
                  {referenceBest != null && referenceBest > 0 && (
                    <ReferenceLine {...progressReferenceLineProps(referenceBest)} />
                  )}
                  <Line
                    type="monotone"
                    dataKey={
                      metricMode === 'volume'
                        ? 'totalVolume'
                        : metricMode === 'e1rm'
                          ? 'bestEstimated1RM'
                          : 'avgLoad'
                    }
                    stroke="#00E676"
                    strokeWidth={2}
                    dot={{ fill: '#00E676', r: 3 }}
                    activeDot={{ r: 5 }}
                    name={
                      metricMode === 'volume'
                        ? t('progress.totalVolume', 'Volume Total')
                        : metricMode === 'e1rm'
                          ? t('progress.estimated1RM', 'Est. 1RM')
                          : t('progress.avgLoad', 'Carga Média')
                    }
                  />
                  {chartData.some((point) => point.trend != null) && (
                    <Line {...progressTrendLineProps(t('progress.trendLine'))} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Period summary */}
          {progression.periodSummary && (
            <ProgressPeriodSummaryCard
              variant="exercise"
              summary={progression.periodSummary}
              metricMode={metricMode}
              granularity={progression.granularity}
              has1RMData={has1RMData}
            />
          )}
          </div>
        </>
      )}
    </div>
  )
}

export function ExerciseProgressionChart({
  startDate,
  endDate,
  statsOptions,
}: Props) {
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
            statsOptions={statsOptions}
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
              statsOptions={statsOptions}
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
