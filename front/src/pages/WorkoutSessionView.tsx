// WorkoutSessionView.tsx
// COMPLETE VERSION — Using Single Endpoint PATCH /workouts/exercises/:id

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
import { useExercises } from '@/api/exercise'

function useDebouncedCallback<T extends (...args: any[]) => void>(cb: T, delay = 300) {
  const t = useRef<number | undefined>(undefined)
  return (...args: Parameters<T>) => {
    window.clearTimeout(t.current)
    t.current = window.setTimeout(() => cb(...args), delay)
  }
}

export default function WorkoutSessionView() {
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

  const { data: exercisesData } = useExercises({ page: 1, limit: 100 })
  const exercises = exercisesData?.data ?? []

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    loadSession()
  }, [user, navigate, id])

  async function loadSession() {
    setLoading(true)
    try {
      const s = await getWorkoutSession(id!)
      setSession({
        ...s,
        title: s.title || 'Free Workout',
      })
    } finally {
      setLoading(false)
    }
  }

  const debouncedSaveMeta = useDebouncedCallback(
    async (patch: Partial<Pick<WorkoutSession, 'title' | 'notes'>>) => {
      if (!session) return
      try {
        await updateWorkoutSession(session.id, patch)
      } catch {
        toast({
          variant: 'error',
          title: 'Saving failed',
        })
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
  }

  function persistExercise(exerciseId: string) {
    if (!session) return
    const ex = session.exercises.find((e) => e.id === exerciseId)
    if (!ex) return

    setSavingId(exerciseId)

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
        toast({ variant: 'error', title: 'Error saving exercise' })
      })
      .finally(() => setSavingId(null))
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
      toast({ variant: 'success', title: 'Exercise removed' })
    } catch {
      toast({ variant: 'error', title: 'Error removing exercise' })
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
      toast({ variant: 'success', title: 'Set removed' })
    } catch {
      toast({ variant: 'error', title: 'Error removing set' })
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
      toast({ variant: 'error', title: 'Error adding set' })
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
      toast({ variant: 'error', title: 'Error adding exercise' })
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
      toast({ variant: 'error', title: 'Could not finish workout' })
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
    return <p className="text-center text-gray-400 mt-10">Loading...</p>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* HEADER */}
      <header className="space-y-3 border-b border-gray-800 pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1 space-y-2">
            <input
              value={session.title ?? ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Workout title"
              className="w-full bg-transparent text-3xl font-bold text-gray-100 border-b border-transparent focus:border-primary focus:outline-none"
            />
            <p className="text-sm text-gray-400">
              Started on {new Date(session.startAt).toLocaleString()}
            </p>
          </div>

          <div className="text-xs px-3 py-1 rounded-full bg-gray-900 border border-gray-700 text-gray-300">
            {completedSets}/{totalSets} sets
          </div>
        </div>

        <textarea
          value={session.notes ?? ''}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Session notes..."
          className="w-full resize-none rounded-md border border-gray-700 bg-[#111] px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:border-primary focus:outline-none"
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
                          Removing...
                        </>
                      ) : (
                        'Remove'
                      )}
                    </button>
                  </div>
                </div>

                {expanded === ex.id && (
                  <div className="border-t border-gray-800 p-4 space-y-3">
                    {ex.sets.map((s) => (
                      <div
                        key={s.id}
                        className={`rounded-lg border p-3 ${
                          s.completed
                            ? 'border-green-600 bg-green-950/20'
                            : 'border-gray-800 bg-[#101010]'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-400">
                            Set {s.setIndex + 1}
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
                              {s.completed ? '✓ Done' : 'Mark Done'}
                            </button>
                            <button
                              onClick={() => handleRemoveSetClick(s.id, ex.id)}
                              disabled={removingSetId === s.id}
                              className="text-xs border border-red-900/60 px-2 py-1 rounded text-red-400 hover:bg-red-900/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              {removingSetId === s.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                'Remove'
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">
                              Load
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
                              className="w-full rounded-md border border-gray-700 bg-[#0f0f0f] px-3 py-2 text-sm text-gray-100"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-gray-400 block mb-1">
                              Reps
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
                              className="w-full rounded-md border border-gray-700 bg-[#0f0f0f] px-3 py-2 text-sm text-gray-100"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-gray-400 block mb-1">
                              RIR
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
                              className="w-full rounded-md border border-gray-700 bg-[#0f0f0f] px-3 py-2 text-sm text-gray-100"
                            />
                          </div>
                        </div>

                        <div className="mt-3">
                          <label className="text-xs text-gray-400 block mb-1">
                            Notes
                          </label>
                          <input
                            type="text"
                            value={s.notes ?? ''}
                            onChange={(e) =>
                              handleSetChange(ex.id, s.id, 'notes', e.target.value)
                            }
                            className="w-full rounded-md border border-gray-700 bg-[#0f0f0f] px-3 py-2 text-sm text-gray-100"
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
                          Adding...
                        </>
                      ) : (
                        '+ Add Set'
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
          className="px-4 py-2 border border-gray-600 rounded-md text-sm text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {addingExercise ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Adding...
            </>
          ) : (
            '+ Add Exercise'
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
              Finishing...
            </>
          ) : (
            'Finish Workout'
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
        title="Remove Exercise"
        message="Are you sure you want to remove this exercise from the workout?"
        confirmText="Remove"
        cancelText="Cancel"
        onConfirm={() => confirmRemoveExerciseId && handleRemoveExercise(confirmRemoveExerciseId)}
        onCancel={() => setConfirmRemoveExerciseId(null)}
      />

      <ConfirmDialog
        open={confirmRemoveSet !== null}
        title="Remove Set"
        message="Are you sure you want to remove this set?"
        confirmText="Remove"
        cancelText="Cancel"
        onConfirm={() => confirmRemoveSet && handleRemoveSet(confirmRemoveSet.setId, confirmRemoveSet.exerciseId)}
        onCancel={() => setConfirmRemoveSet(null)}
      />
    </div>
  )
}
