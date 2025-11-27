// WorkoutSessionView.tsx
// COMPLETE VERSION — Using Single Endpoint PATCH /workouts/exercises/:id

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/AuthContext'
import { useToast } from '@/components/ToastProvider'
import { Loader2, TrendingUp } from 'lucide-react'
import {
  getWorkoutSession,
  updateWorkoutSession,
  updateWorkoutExercise,
  addSetToExercise,
  addExerciseToSession,
  finishWorkoutSession,
  deleteExerciseFromSession,
  deleteSetFromExercise,
  type WorkoutSession,
  type SessionExercise,
  type SessionSet,
  type SetIntensityType,
  type UpdateWorkoutExerciseDto,
  type SessionSetIntensityBlock,
} from '@/api/workoutSession'
import { ExercisePickerModal } from '@/components/ExercisePickerModal'
import { FinishWorkoutDialog, type FinishWorkoutData } from '@/components/FinishWorkoutDialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { RestTimer } from '@/components/RestTimer'
import { RestTimerManager } from '@/components/RestTimerManager'
import { RestTimerCountdown } from '@/components/RestTimerCountdown'
import { ExerciseHistoryBottomSheet } from '@/components/ExerciseHistoryBottomSheet'
import { useExercises } from '@/api/exercise'

type SetIntensityEditorProps = {
  set: SessionSet
  onChangeType: (type: SetIntensityType | null) => void
  onChangeBlocks: (blocks: SessionSet['intensityBlocks']) => void
  onChangeTypeAndBlocks?: (type: SetIntensityType | null, blocks: SessionSet['intensityBlocks']) => void
}

function SetIntensityEditor({ set, onChangeType, onChangeBlocks, onChangeTypeAndBlocks }: SetIntensityEditorProps) {
  const { t } = useTranslation()

  const intensityType: SetIntensityType =
    set.intensityType && set.intensityType !== 'NONE' ? set.intensityType : 'NONE'

  const handleAddBlock = () => {
    const currentBlocks = set.intensityBlocks ?? []
    const nextIndex =
      currentBlocks.length > 0
        ? Math.max(...currentBlocks.map((b) => b.blockIndex)) + 1
        : 0

    const newBlock = {
      // id temporário apenas para chave de renderização; o backend gerará o id real
      id: `temp-${crypto.randomUUID()}`,
      blockIndex: nextIndex,
      reps: null,
      restSeconds: null,
    }

    onChangeBlocks([...currentBlocks, newBlock])
  }

  const handleBlockChange = (
    blockId: string,
    field: 'reps' | 'restSeconds',
    value: number | null,
  ) => {
    const currentBlocks = set.intensityBlocks ?? []
    onChangeBlocks(
      currentBlocks.map((b) =>
        b.id === blockId
          ? {
              ...b,
              [field]: value,
            }
          : b,
      ),
    )
  }

  const handleRemoveBlock = (blockId: string) => {
    const currentBlocks = set.intensityBlocks ?? []
    onChangeBlocks(currentBlocks.filter((b) => b.id !== blockId))
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-800">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">
          {t('workout.intensityTechniques', 'Técnicas de intensidade')}
        </span>
        <select
          value={intensityType}
          onChange={(e) => {
            const next = e.target.value as SetIntensityType
            if (next === 'NONE') {
              if (onChangeTypeAndBlocks) {
                onChangeTypeAndBlocks(null, [])
              } else {
                onChangeType(null)
                onChangeBlocks([])
              }
            } else {
              const currentBlocks = set.intensityBlocks ?? []
              const shouldAddFirstBlock = currentBlocks.length === 0 && next === 'REST_PAUSE'
              
              // Atualizar tipo e blocos em uma única operação para evitar requisições duplicadas
              if (shouldAddFirstBlock && onChangeTypeAndBlocks) {
                const firstBlock = {
                  id: `temp-${crypto.randomUUID()}`,
                  blockIndex: 0,
                  reps: null,
                  restSeconds: null,
                }
                onChangeTypeAndBlocks(next, [firstBlock])
              } else {
                onChangeType(next)
              }
            }
          }}
          className="text-sm bg-[#0f0f0f] border border-gray-700 rounded px-2.5 py-1.5 text-gray-200 focus:border-gray-600 focus:outline-none transition"
        >
          <option value="NONE">{t('workout.intensityNone', 'Nenhuma')}</option>
          <option value="REST_PAUSE">{t('workout.intensityRestPause', 'Rest-pause')}</option>
          {/* futuros tipos: DROP_SET, CLUSTER_SET */}
        </select>
      </div>

      {intensityType === 'REST_PAUSE' && (
        <div className="space-y-2">
          {(set.intensityBlocks ?? []).length === 0 && (
            <p className="text-xs text-gray-500">
              {t(
                'workout.intensityRestPauseHint',
                'Adicione blocos de reps extras com descanso curto.',
              )}
            </p>
          )}

          {(set.intensityBlocks ?? []).map((block, idx) => (
            <div key={block.id ?? idx} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-8">
                #{idx + 1}
              </span>
              <input
                type="number"
                min={0}
                value={block.reps ?? ''}
                onChange={(e) =>
                  handleBlockChange(
                    block.id!,
                    'reps',
                    e.target.value === '' ? null : Number(e.target.value),
                  )
                }
                className="flex-1 rounded-md border border-gray-700 bg-[#0f0f0f] px-2.5 py-1.5 text-sm text-gray-100 focus:border-gray-600 focus:outline-none transition"
                placeholder={t('workout.repsLabel', 'reps')}
              />
              <input
                type="number"
                min={0}
                value={block.restSeconds ?? ''}
                onChange={(e) =>
                  handleBlockChange(
                    block.id!,
                    'restSeconds',
                    e.target.value === '' ? null : Number(e.target.value),
                  )
                }
                className="w-20 rounded-md border border-gray-700 bg-[#0f0f0f] px-2.5 py-1.5 text-sm text-gray-100 focus:border-gray-600 focus:outline-none transition"
                placeholder={t('workout.seconds', 'seg')}
              />
              <button
                type="button"
                onClick={() => handleRemoveBlock(block.id!)}
                className="p-1.5 rounded border border-red-900/60 text-red-400 hover:bg-red-900/40 transition"
                title={t('workout.remove', 'Remover')}
              >
                <span className="text-sm">×</span>
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddBlock}
            className="text-xs mt-1 px-2.5 py-1.5 border border-gray-700 rounded text-gray-300 hover:bg-gray-800/60 transition"
          >
            {t('workout.addRestPauseBlock', 'Adicionar bloco')}
          </button>
        </div>
      )}
    </div>
  )
}

function useDebouncedCallback<T extends (...args: any[]) => void>(cb: T, delay = 300) {
  const t = useRef<number | undefined>(undefined)
  return (...args: Parameters<T>) => {
    window.clearTimeout(t.current)
    t.current = window.setTimeout(() => cb(...args), delay)
  }
}

export default function WorkoutSessionView() {
  const { t, i18n } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const [session, setSession] = useState<WorkoutSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [_savingId, setSavingId] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [finishOpen, setFinishOpen] = useState(false)
  const [removingExerciseId, setRemovingExerciseId] = useState<string | null>(null)
  const [removingSetId, setRemovingSetId] = useState<string | null>(null)
  const [addingExercise, setAddingExercise] = useState(false)
  const [addingSetId, setAddingSetId] = useState<string | null>(null)
  const [finishingWorkout, setFinishingWorkout] = useState(false)
  const [confirmRemoveExerciseId, setConfirmRemoveExerciseId] = useState<string | null>(null)
  const [confirmRemoveSet, setConfirmRemoveSet] = useState<{ setId: string; exerciseId: string } | null>(null)
  const [timerOpen, setTimerOpen] = useState(false)
  const [timerManagerOpen, setTimerManagerOpen] = useState(false)
  const [countdownActive, setCountdownActive] = useState<{ seconds: number; startTime?: number } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [historyExerciseId, setHistoryExerciseId] = useState<string | null>(null)

  const { data: exercisesData } = useExercises({ page: 1, limit: 100 })
  const exercises = exercisesData?.data ?? []

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    loadSession()

    // Restore timer if active
    const saved = localStorage.getItem('restTimerActive')
    if (saved) {
      try {
        const savedState = JSON.parse(saved)
        const now = Date.now()
        const elapsed = savedState.pausedAt
          ? (savedState.elapsedBeforePause || 0)
          : (now - savedState.startTime) / 1000
        const remaining = Math.max(0, savedState.initialSeconds - elapsed)

        if (remaining > 0) {
          setCountdownActive({
            seconds: remaining,
            startTime: savedState.startTime,
          })
        } else {
          localStorage.removeItem('restTimerActive')
        }
      } catch (err) {
        console.error('Failed to restore timer:', err)
        localStorage.removeItem('restTimerActive')
      }
    }
  }, [user, navigate, id])

  async function loadSession() {
    setLoading(true)
    try {
      const s = await getWorkoutSession(id!)
      // Garantir que completed seja sempre boolean
      const sessionData = {
        ...s,
        title: s.title || t('workout.freeWorkoutLabel'),
        exercises: (s.exercises || []).map((ex) => ({
          ...ex,
          sets: (ex.sets || []).map((set) => ({
            ...set,
            completed: Boolean(set.completed),
          })),
        })),
      }
      setSession(sessionData)

      // Encontrar o primeiro exercício com séries não completadas
      const sortedExercises = [...sessionData.exercises].sort((a, b) => a.order - b.order)
      for (const ex of sortedExercises) {
        const hasIncompleteSets = ex.sets.some(
          (set) => !set.completed || set.actualLoad == null || set.actualReps == null
        )
        if (hasIncompleteSets) {
          setExpanded(ex.id)
          break
        }
      }
    } catch (error) {
      console.error('Error loading session:', error)
      toast({
        variant: 'error',
        title: t('workout.errorLoading'),
      })
    } finally {
      setLoading(false)
    }
  }

  const debouncedSaveMeta = useDebouncedCallback(
    async (patch: Partial<Pick<WorkoutSession, 'title' | 'notes'>>) => {
      if (!session) return
      setIsSaving(true)
      try {
        await updateWorkoutSession(session.id, patch)
      } catch {
        toast({
          variant: 'error',
          title: t('workout.errorSaving'),
        })
      } finally {
        setIsSaving(false)
      }
    },
    1500,
  )

  const handleSetChange = (exerciseId: string, setId: string, field: string, raw: any) => {
    if (!session) return

    let value = raw

    // Campos string ou complexos não devem ser convertidos para número
    const isStringField = field === 'notes' || field === 'intensityType'

    if (value === '' || value == null) value = null
    else if (!isStringField && typeof value !== 'boolean') value = Number(value)

    // Criar o exercício atualizado ANTES de atualizar o estado
    const ex = session.exercises.find((e) => e.id === exerciseId)
    if (!ex) return
    
    const updatedExercise = structuredClone(ex)
    const s = updatedExercise.sets.find((ss) => ss.id === setId)
    if (!s) return
    
    // Atualizar o valor no exercício clonado
    ;(s as any)[field] = value

    // Atualizar o estado
    setSession((prev) => {
      if (!prev) return prev
      const copy = structuredClone(prev)
      const exCopy = copy.exercises.find((e) => e.id === exerciseId)
      if (!exCopy) return prev
      const sCopy = exCopy.sets.find((ss) => ss.id === setId)
      if (!sCopy) return prev
      ;(sCopy as any)[field] = value
      return copy
    })

    // Usar o exercício atualizado diretamente
    persistExercise(exerciseId, updatedExercise)

    // Abrir modal automaticamente quando marcar set como concluído
    if (field === 'completed' && value === true) {
      setTimerOpen(true)
    }
  }

  function persistExercise(exerciseId: string, exercise?: SessionExercise) {
    // Usar o exercício passado como parâmetro ou buscar do estado
    const ex = exercise || session?.exercises.find((e) => e.id === exerciseId)
    if (!ex || !session) return

    setSavingId(exerciseId)
    setIsSaving(true)

    const payloadSets: NonNullable<UpdateWorkoutExerciseDto['sets']> = ex.sets.map((s) => ({
      id: s.id,
      setIndex: s.setIndex,
      plannedReps: s.plannedReps ?? null,
      plannedRir: s.plannedRir ?? null,
      actualLoad: s.actualLoad ?? null,
      actualReps: s.actualReps ?? null,
      actualRir: s.actualRir ?? null,
      completed: Boolean(s.completed),
      notes: s.notes ?? null,
      intensityType: s.intensityType ?? undefined,
      intensityBlocks: (s.intensityBlocks ?? []).map((b) => ({
        id: b.id && b.id.startsWith('temp-') ? '' : b.id,
        blockIndex: b.blockIndex,
        reps: b.reps,
        restSeconds: b.restSeconds ?? null,
      })) as SessionSetIntensityBlock[],
    }))

    updateWorkoutExercise(exerciseId, {
      order: ex.order,
      notes: ex.notes ?? null,
      sets: payloadSets,
    })
      .catch(() => {
        toast({ variant: 'error', title: t('workout.errorSavingExercise') })
      })
      .finally(() => {
        setSavingId(null)
        setIsSaving(false)
      })
  }

  const handleMoveExercise = (exerciseId: string, dir: 'up' | 'down') => {
    setSession((prev) => {
      if (!prev) return prev
      const copy = structuredClone(prev)

      const sorted = [...copy.exercises].sort((a, b) => a.order - b.order)
      const index = sorted.findIndex((e) => e.id === exerciseId)
      if (index === -1) return prev

      const newIndex = dir === 'up' ? index - 1 : index + 1
      if (newIndex < 0 || newIndex >= sorted.length) return prev

      const tmp = sorted[index]
      sorted[index] = sorted[newIndex]
      sorted[newIndex] = tmp

      sorted.forEach((e, idx) => (e.order = idx))

      copy.exercises = sorted
      return copy
    })

    persistExercise(exerciseId)
  }

  const handleRemoveExerciseClick = (exerciseId: string) => {
    setConfirmRemoveExerciseId(exerciseId)
  }

  const handleRemoveExercise = async (exerciseId: string) => {
    setConfirmRemoveExerciseId(null)
    setRemovingExerciseId(exerciseId)
    try {
      await deleteExerciseFromSession(exerciseId)
      setSession((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          exercises: prev.exercises.filter((ex) => ex.id !== exerciseId),
        }
      })
      toast({ variant: 'success', title: t('workout.exerciseRemoved') })
    } catch {
      toast({ variant: 'error', title: t('workout.errorRemovingExercise') })
    } finally {
      setRemovingExerciseId(null)
    }
  }

  const handleRemoveSetClick = (setId: string, exerciseId: string) => {
    setConfirmRemoveSet({ setId, exerciseId })
  }

  const handleRemoveSet = async (setId: string, exerciseId: string) => {
    setConfirmRemoveSet(null)
    setRemovingSetId(setId)
    try {
      await deleteSetFromExercise(setId)
      setSession((prev) => {
        if (!prev) return prev
        const copy = structuredClone(prev)
        const ex = copy.exercises.find((e) => e.id === exerciseId)
        if (ex) {
          ex.sets = ex.sets.filter((s) => s.id !== setId)
        }
        return copy
      })
      toast({ variant: 'success', title: t('workout.setRemoved') })
    } catch {
      toast({ variant: 'error', title: t('workout.errorRemovingSet') })
    } finally {
      setRemovingSetId(null)
    }
  }

  const handleAddSet = async (exercise: SessionExercise) => {
    const nextIndex =
      exercise.sets.length > 0 ? Math.max(...exercise.sets.map((s) => s.setIndex)) + 1 : 0

    setAddingSetId(exercise.id)
    try {
      const created = await addSetToExercise(exercise.id, { setIndex: nextIndex })

      setSession((prev) => {
        if (!prev) return prev
        const copy = structuredClone(prev)
        const ex = copy.exercises.find((e) => e.id === exercise.id)
        if (ex) ex.sets.push(created)
        return copy
      })

      persistExercise(exercise.id)
    } catch {
      toast({ variant: 'error', title: t('workout.errorAddingSet') })
    } finally {
      setAddingSetId(null)
    }
  }

  const handleAddExercise = async (exerciseId: string) => {
    if (!session) return

    const order =
      session.exercises.length > 0
        ? Math.max(...session.exercises.map((e) => e.order)) + 1
        : 0

    setAddingExercise(true)
    try {
      const created = await addExerciseToSession(session.id, { exerciseId, order })

      setSession((prev) => {
        if (!prev) return prev
        const copy = structuredClone(prev)
        copy.exercises.push(created)
        return copy
      })

      // Expandir o exercício recém-criado
      setExpanded(created.id)

      setPickerOpen(false)

      // Fazer scroll para o exercício após um pequeno delay para garantir que o DOM foi atualizado
      setTimeout(() => {
        const exerciseElement = document.querySelector(`[data-exercise-id="${created.id}"]`)
        if (exerciseElement) {
          exerciseElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    } catch {
      toast({ variant: 'error', title: t('workout.errorAddingExercise') })
    } finally {
      setAddingExercise(false)
    }
  }

  const handleFinishWorkout = async (data: FinishWorkoutData) => {
    setFinishingWorkout(true)
    try {
      await finishWorkoutSession(session!.id, data)
      navigate('/app')
    } catch {
      toast({ variant: 'error', title: t('workout.errorFinishing') })
    } finally {
      setFinishingWorkout(false)
    }
  }

  const handleTitleChange = (value: string) => {
    setSession((prev) => (prev ? { ...prev, title: value } : prev))
    debouncedSaveMeta({ title: value || undefined })
  }

  const handleNotesChange = (value: string) => {
    setSession((prev) => (prev ? { ...prev, notes: value || undefined } : prev))
    debouncedSaveMeta({ notes: value || undefined })
  }

  const totalSets = useMemo(
    () => session?.exercises.reduce((acc, ex) => acc + ex.sets.length, 0) ?? 0,
    [session],
  )

  const completedSets = useMemo(
    () =>
      session?.exercises.reduce(
        (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
        0,
      ) ?? 0,
    [session],
  )

  if (loading || !session)
    return <p className="text-center text-gray-400 mt-10">{t('common.loading')}</p>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* HEADER */}
      <header className="space-y-3 border-b border-gray-800 pb-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex items-center gap-3">
              <input
                value={session.title ?? ''}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder={t('workout.workoutTitle')}
                className="flex-1 bg-transparent text-2xl sm:text-3xl font-bold text-gray-100 border-b border-transparent focus:border-primary focus:outline-none min-w-0"
              />
              {isSaving && (
                <div className="flex items-center gap-2 text-sm text-primary flex-shrink-0">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">{t('workout.saving')}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-400">
              {t('workout.startedOn')} {new Date(session.startAt).toLocaleString(i18n.language === 'pt' ? 'pt-BR' : 'en-US')}
            </p>
          </div>

          <div className="text-xs px-3 py-1 rounded-full bg-gray-900 border border-gray-700 text-gray-300 whitespace-nowrap flex-shrink-0 self-start sm:self-auto">
            {completedSets}/{totalSets} {t('workout.sets')}
          </div>
        </div>

        <textarea
          value={session.notes ?? ''}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder={t('workout.sessionNotes')}
          className="w-full resize-none rounded-md border border-gray-700 bg-[#111] px-3 py-2 text-base text-gray-100 placeholder:text-gray-500 focus:border-primary focus:outline-none"
          rows={2}
        />
      </header>

      {/* EXERCISE LIST */}
      <div className="space-y-4">
        {session.exercises
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((ex, idx, arr) => {
            const doneCount = ex.sets.filter((s) => s.completed).length
            const isFirst = idx === 0
            const isLast = idx === arr.length - 1

            return (
              <div key={ex.id} data-exercise-id={ex.id} className="rounded-xl border border-gray-800 bg-[#151515]">
                <div className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <button
                      onClick={() => setExpanded(expanded === ex.id ? null : ex.id)}
                      className="flex-1 text-left min-w-0"
                    >
                      <h3 className="text-lg font-semibold text-gray-100 truncate">
                        {ex.exercise.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {ex.exercise.muscleGroup && (
                          <>
                            <span className="text-xs text-gray-500 uppercase">
                              {ex.exercise.muscleGroup}
                            </span>
                            <span className="text-gray-600">·</span>
                          </>
                        )}
                        <span className="text-xs text-gray-400">
                          {doneCount}/{ex.sets.length} {t('workout.sets', 'sets')}
                        </span>
                      </div>
                    </button>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {expanded === ex.id && (
                        <button
                          onClick={() => setHistoryExerciseId(ex.exercise.id)}
                          className="w-[48px] h-[48px] rounded hover:bg-gray-800/60 text-gray-400 hover:text-gray-200 transition flex items-center justify-center touch-manipulation"
                          title={t('workout.viewHistory', 'Histórico')}
                        >
                          <TrendingUp className="w-5 h-5" />
                        </button>
                      )}
                      <div className="flex flex-col gap-1 h-[48px] justify-center">
                        <button
                          disabled={isFirst}
                          onClick={() => handleMoveExercise(ex.id, 'up')}
                          className="w-[48px] h-[23px] text-sm rounded border border-gray-700 text-gray-400 hover:text-gray-200 hover:bg-gray-800/40 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center touch-manipulation"
                          title={t('workout.moveUp', 'Mover para cima')}
                        >
                          ↑
                        </button>
                        <button
                          disabled={isLast}
                          onClick={() => handleMoveExercise(ex.id, 'down')}
                          className="w-[48px] h-[23px] text-sm rounded border border-gray-700 text-gray-400 hover:text-gray-200 hover:bg-gray-800/40 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center touch-manipulation"
                          title={t('workout.moveDown', 'Mover para baixo')}
                        >
                          ↓
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemoveExerciseClick(ex.id)}
                        disabled={removingExerciseId === ex.id}
                        className="w-[48px] h-[48px] rounded border border-red-900/60 text-red-400 hover:bg-red-900/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center touch-manipulation"
                        title={t('workout.remove', 'Remover')}
                      >
                        {removingExerciseId === ex.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <span className="text-lg">×</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {expanded === ex.id && (
                  <div className="border-t border-gray-800 p-4 space-y-3">
                    {ex.sets.map((s) => (
                      <div
                        key={s.id}
                        data-set-id={s.id}
                        className={`rounded-lg border p-4 ${
                          s.completed
                            ? 'border-green-600/30 bg-green-950/10'
                            : 'border-gray-800 bg-[#101010]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-medium text-gray-200">
                            {t('workout.setNumber', { number: s.setIndex + 1 })}
                          </span>

                          <div className="flex items-center gap-3">
                            <button
                              onClick={() =>
                                handleSetChange(
                                  ex.id,
                                  s.id,
                                  'completed',
                                  !s.completed,
                                )
                              }
                              className={`h-[48px] text-xs px-4 rounded font-medium transition flex items-center justify-center touch-manipulation ${
                                s.completed
                                  ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                                  : 'border border-gray-700 text-gray-300 hover:bg-gray-800/60 hover:border-gray-600'
                              }`}
                            >
                              {s.completed ? '✓ ' + t('workout.done', 'Concluído') : t('workout.markDone', 'Marcar Concluído')}
                            </button>
                            {s.completed && (
                              <button
                                onClick={() => setTimerOpen(true)}
                                className="h-[48px] text-xs px-4 rounded font-medium text-primary border border-primary/50 hover:bg-primary/10 transition flex items-center justify-center touch-manipulation"
                              >
                                {t('workout.startRest', 'Descanso')}
                              </button>
                            )}
                            <button
                              onClick={() => handleRemoveSetClick(s.id, ex.id)}
                              disabled={removingSetId === s.id}
                              className="w-[48px] h-[48px] rounded border border-red-900/60 text-red-400 hover:bg-red-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center touch-manipulation"
                              title={t('workout.remove', 'Remover')}
                            >
                              {removingSetId === s.id ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <span className="text-lg">×</span>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Mostrar valores planejados apenas se for treino de template */}
                        {session.templateId && (s.plannedReps != null || s.plannedRir != null) && (
                          <div className="mb-3 px-2.5 py-1.5 rounded bg-gray-900/30 border border-gray-800/50">
                            <div className="text-xs text-gray-500 mb-0.5">{t('workout.planned', 'Planejado')}</div>
                            <div className="text-xs text-gray-300">
                              {s.plannedReps != null && (
                                <span>
                                  {s.plannedReps} {t('workout.repsLabel', 'reps')}
                                </span>
                              )}
                              {s.plannedReps != null && s.plannedRir != null && (
                                <span className="text-gray-600 mx-1.5">·</span>
                              )}
                              {s.plannedRir != null && (
                                <span>
                                  {t('workout.rir', 'RIR')} {s.plannedRir}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div>
                            <label className="text-xs text-gray-400 block mb-1.5">
                              {t('workout.load', 'Carga')}
                            </label>
                            <input
                              type="number"
                              value={s.actualLoad ?? ''}
                              onChange={(e) =>
                                handleSetChange(
                                  ex.id,
                                  s.id,
                                  'actualLoad',
                                  e.target.value,
                                )
                              }
                              className="w-full rounded-md border border-gray-700 bg-[#0f0f0f] px-3 py-2.5 text-base text-gray-100 focus:border-primary focus:outline-none transition"
                              placeholder="0"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-gray-400 block mb-1.5">
                              {t('workout.reps', 'Reps')}
                            </label>
                            <input
                              type="number"
                              value={s.actualReps ?? ''}
                              onChange={(e) =>
                                handleSetChange(
                                  ex.id,
                                  s.id,
                                  'actualReps',
                                  e.target.value,
                                )
                              }
                              className="w-full rounded-md border border-gray-700 bg-[#0f0f0f] px-3 py-2.5 text-base text-gray-100 focus:border-primary focus:outline-none transition"
                              placeholder="0"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-gray-400 block mb-1.5">
                              {t('workout.rir', 'RIR')}
                            </label>
                            <input
                              type="number"
                              value={s.actualRir ?? ''}
                              onChange={(e) =>
                                handleSetChange(
                                  ex.id,
                                  s.id,
                                  'actualRir',
                                  e.target.value,
                                )
                              }
                              className="w-full rounded-md border border-gray-700 bg-[#0f0f0f] px-3 py-2.5 text-base text-gray-100 focus:border-primary focus:outline-none transition"
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <div className="mb-3">
                          <input
                            type="text"
                            value={s.notes ?? ''}
                            onChange={(e) =>
                              handleSetChange(ex.id, s.id, 'notes', e.target.value)
                            }
                            placeholder={t('workout.notes', 'Notas (opcional)')}
                            className="w-full rounded-md border border-gray-700 bg-[#0f0f0f] px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-gray-600 focus:outline-none transition"
                          />
                        </div>

                        {/* INTENSITY TECHNIQUES */}
                        <SetIntensityEditor
                          set={s}
                          onChangeType={(type) => {
                            // Atualizar apenas o tipo
                            handleSetChange(ex.id, s.id, 'intensityType', type)
                          }}
                          onChangeBlocks={(blocks) => {
                            // Atualizar apenas os blocos
                            setSession((prev) => {
                              if (!prev) return prev
                              const copy = structuredClone(prev)
                              const exercise = copy.exercises.find((e) => e.id === ex.id)
                              if (!exercise) return prev
                              const set = exercise.sets.find((ss) => ss.id === s.id)
                              if (!set) return prev
                              ;(set as any).intensityBlocks = blocks
                              return copy
                            })
                            persistExercise(ex.id)
                          }}
                          onChangeTypeAndBlocks={(type, blocks) => {
                            // Atualizar tipo e blocos em uma única operação para evitar requisições duplicadas
                            setSession((prev) => {
                              if (!prev) return prev
                              const copy = structuredClone(prev)
                              const exercise = copy.exercises.find((e) => e.id === ex.id)
                              if (!exercise) return prev
                              const set = exercise.sets.find((ss) => ss.id === s.id)
                              if (!set) return prev
                              ;(set as any).intensityType = type
                              ;(set as any).intensityBlocks = blocks
                              return copy
                            })
                            persistExercise(ex.id)
                          }}
                        />
                      </div>
                    ))}

                    <button
                      onClick={() => handleAddSet(ex)}
                      disabled={addingSetId === ex.id}
                      className="w-full mt-2 border border-gray-700 py-2 text-sm text-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {addingSetId === ex.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t('common.adding')}
                        </>
                      ) : (
                        t('workout.addSet')
                      )}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
      </div>

      {/* ADD EXERCISE */}
      <div className="flex justify-center">
        <button
          onClick={() => setPickerOpen(true)}
          disabled={addingExercise}
          className="px-4 py-2 border border-gray-600 rounded-md text-sm text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {addingExercise ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('common.adding')}
            </>
          ) : (
            t('workout.addExercise')
          )}
        </button>
      </div>

      {/* FOOTER */}
      <div className="sticky bottom-0 left-0 right-0 bg-[#0f0f0f]/95 border-t border-gray-800 px-4 py-3">
        <button
          onClick={() => setFinishOpen(true)}
          disabled={finishingWorkout}
          className="w-full bg-primary text-black py-3 rounded-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {finishingWorkout ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('common.finishing')}
            </>
          ) : (
            t('workout.finish')
          )}
        </button>
      </div>

      <FinishWorkoutDialog
        open={finishOpen}
        onClose={() => setFinishOpen(false)}
        onConfirm={handleFinishWorkout}
      />

      <ExercisePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleAddExercise}
        exercises={exercises}
      />

      <ConfirmDialog
        open={confirmRemoveExerciseId !== null}
        title={t('dialog.removeExercise')}
        message={t('dialog.removeExerciseMessage')}
        confirmText={t('workout.remove')}
        cancelText={t('common.cancel')}
        onConfirm={() => confirmRemoveExerciseId && handleRemoveExercise(confirmRemoveExerciseId)}
        onCancel={() => setConfirmRemoveExerciseId(null)}
      />

      <ConfirmDialog
        open={confirmRemoveSet !== null}
        title={t('dialog.removeSet')}
        message={t('dialog.removeSetMessage')}
        confirmText={t('workout.remove')}
        cancelText={t('common.cancel')}
        onConfirm={() => confirmRemoveSet && handleRemoveSet(confirmRemoveSet.setId, confirmRemoveSet.exerciseId)}
        onCancel={() => setConfirmRemoveSet(null)}
      />

      {/* REST TIMER */}
      {countdownActive && (
        <RestTimerCountdown
          initialSeconds={countdownActive.seconds}
          onComplete={() => setCountdownActive(null)}
          onStop={() => setCountdownActive(null)}
        />
      )}

      <RestTimer
        open={timerOpen}
        onClose={() => setTimerOpen(false)}
        onStart={(seconds) => {
          setCountdownActive({ seconds })
          setTimerOpen(false)
        }}
        onManageClick={() => setTimerManagerOpen(true)}
      />

      <RestTimerManager
        open={timerManagerOpen}
        onClose={() => setTimerManagerOpen(false)}
      />

      {/* Exercise History Bottom Sheet */}
      {historyExerciseId && (
        <ExerciseHistoryBottomSheet
          open={historyExerciseId !== null}
          onClose={() => setHistoryExerciseId(null)}
          exerciseId={historyExerciseId}
          exerciseName={session?.exercises.find((e) => e.exercise.id === historyExerciseId)?.exercise.name || ''}
        />
      )}
    </div>
  )
}
