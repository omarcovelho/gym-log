// WorkoutSessionView.tsx
// COMPLETE VERSION — Using Single Endpoint PATCH /workouts/exercises/:id

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/AuthContext'
import { useToast } from '@/components/ToastProvider'
import { Loader2 } from 'lucide-react'
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
} from '@/api/workoutSession'
import { ExercisePickerModal } from '@/components/ExercisePickerModal'
import { FinishWorkoutDialog, type FinishWorkoutData } from '@/components/FinishWorkoutDialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { RestTimer } from '@/components/RestTimer'
import { RestTimerManager } from '@/components/RestTimerManager'
import { RestTimerCountdown } from '@/components/RestTimerCountdown'
import { useExercises } from '@/api/exercise'

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
      setSession({
        ...s,
        title: s.title || t('workout.freeWorkoutLabel'),
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
    500,
  )

  const handleSetChange = (exerciseId: string, setId: string, field: string, raw: any) => {
    let value = raw
    if (value === '' || value == null) value = null
    else if (typeof value !== 'boolean') value = Number(value)

    setSession((prev) => {
      if (!prev) return prev
      const copy = structuredClone(prev)
      const ex = copy.exercises.find((e) => e.id === exerciseId)
      if (!ex) return prev
      const s = ex.sets.find((ss) => ss.id === setId)
      if (!s) return prev
      ;(s as any)[field] = value
      return copy
    })

    persistExercise(exerciseId)

    // Abrir modal automaticamente quando marcar set como concluído
    if (field === 'completed' && value === true) {
      setTimerOpen(true)
    }
  }

  function persistExercise(exerciseId: string) {
    if (!session) return
    const ex = session.exercises.find((e) => e.id === exerciseId)
    if (!ex) return

    setSavingId(exerciseId)
    setIsSaving(true)

    updateWorkoutExercise(exerciseId, {
      order: ex.order,
      notes: ex.notes ?? null,
      sets: ex.sets.map((s) => ({
        id: s.id,
        setIndex: s.setIndex,
        plannedReps: s.plannedReps ?? null,
        plannedRir: s.plannedRir ?? null,
        actualLoad: s.actualLoad ?? null,
        actualReps: s.actualReps ?? null,
        actualRir: s.actualRir ?? null,
        completed: s.completed ?? false,
        notes: s.notes ?? null,
      })),
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

      setPickerOpen(false)
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
        <div className="flex justify-between items-start">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <input
                value={session.title ?? ''}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder={t('workout.workoutTitle')}
                className="flex-1 bg-transparent text-3xl font-bold text-gray-100 border-b border-transparent focus:border-primary focus:outline-none"
              />
              {isSaving && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('workout.saving')}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-400">
              {t('workout.startedOn')} {new Date(session.startAt).toLocaleString(i18n.language === 'pt' ? 'pt-BR' : 'en-US')}
            </p>
          </div>

          <div className="text-xs px-3 py-1 rounded-full bg-gray-900 border border-gray-700 text-gray-300">
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
              <div key={ex.id} className="rounded-xl border border-gray-800 bg-[#151515]">
                <div className="flex items-center justify-between px-4 py-3">
                  <button
                    onClick={() => setExpanded(expanded === ex.id ? null : ex.id)}
                    className="flex-1 text-left flex items-center justify-between gap-3"
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-gray-100">
                        {ex.exercise.name}
                      </h3>
                      <p className="text-xs text-gray-500 uppercase">
                        {ex.exercise.muscleGroup ?? ''}
                      </p>
                    </div>

                    <div className="text-xs text-gray-400">
                      {doneCount}/{ex.sets.length}
                    </div>
                  </button>

                  <div className="flex flex-col gap-1 ml-3">
                    <button
                      disabled={isFirst}
                      onClick={() => handleMoveExercise(ex.id, 'up')}
                      className="text-[10px] px-2 py-1 border rounded border-gray-700 text-gray-300 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      disabled={isLast}
                      onClick={() => handleMoveExercise(ex.id, 'down')}
                      className="text-[10px] px-2 py-1 border rounded border-gray-700 text-gray-300 disabled:opacity-30"
                    >
                      ↓
                    </button>

                    <button
                      onClick={() => handleRemoveExerciseClick(ex.id)}
                      disabled={removingExerciseId === ex.id}
                      className="text-[10px] px-2 py-1 rounded border border-red-900/60 text-red-400 hover:bg-red-900/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {removingExerciseId === ex.id ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          {t('common.removing')}
                        </>
                      ) : (
                        t('workout.remove')
                      )}
                    </button>
                  </div>
                </div>

                {expanded === ex.id && (
                  <div className="border-t border-gray-800 p-4 space-y-3">
                    {ex.sets.map((s) => (
                      <div
                        key={s.id}
                        data-set-id={s.id}
                        className={`rounded-lg border p-3 ${
                          s.completed
                            ? 'border-green-600 bg-green-950/20'
                            : 'border-gray-800 bg-[#101010]'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-400">
                            {t('workout.setNumber', { number: s.setIndex + 1 })}
                          </span>

                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleSetChange(
                                  ex.id,
                                  s.id,
                                  'completed',
                                  !s.completed,
                                )
                              }
                              className="text-xs border px-2 py-1 rounded text-gray-300"
                            >
                              {s.completed ? t('workout.done') : t('workout.markDone')}
                            </button>
                            {s.completed && (
                              <button
                                onClick={() => setTimerOpen(true)}
                                className="text-xs border px-2 py-1 rounded text-primary border-primary/50 hover:bg-primary/10 transition"
                              >
                                {t('workout.startRest')}
                              </button>
                            )}
                            <button
                              onClick={() => handleRemoveSetClick(s.id, ex.id)}
                              disabled={removingSetId === s.id}
                              className="text-xs border border-red-900/60 px-2 py-1 rounded text-red-400 hover:bg-red-900/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              {removingSetId === s.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                t('workout.remove')
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">
                              {t('workout.load')}
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
                              className="w-full rounded-md border border-gray-700 bg-[#0f0f0f] px-3 py-2 text-base text-gray-100"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-gray-400 block mb-1">
                              {t('workout.reps')}
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
                              className="w-full rounded-md border border-gray-700 bg-[#0f0f0f] px-3 py-2 text-base text-gray-100"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-gray-400 block mb-1">
                              {t('workout.rir')}
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
                              className="w-full rounded-md border border-gray-700 bg-[#0f0f0f] px-3 py-2 text-base text-gray-100"
                            />
                          </div>
                        </div>

                        <div className="mt-3">
                          <label className="text-xs text-gray-400 block mb-1">
                            {t('workout.notes')}
                          </label>
                          <input
                            type="text"
                            value={s.notes ?? ''}
                            onChange={(e) =>
                              handleSetChange(ex.id, s.id, 'notes', e.target.value)
                            }
                            className="w-full rounded-md border border-gray-700 bg-[#0f0f0f] px-3 py-2 text-base text-gray-100"
                          />
                        </div>
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
    </div>
  )
}
