import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { useToast } from '@/components/ToastProvider'
import {
  getWorkoutSession,
  updateSet,
  addSetToExercise,
  addExerciseToSession,
  finishWorkoutSession,
  type WorkoutSession,
  type SessionExercise,
} from '@/api/workoutSession'
import { api } from '@/lib/api'
import { ExercisePickerModal, type Exercise } from '@/components/ExercisePickerModal'
import { FinishWorkoutDialog, type FinishWorkoutData } from '@/components/FinishWorkoutDialog'

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
  const [savingSetId, setSavingSetId] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [finishOpen, setFinishOpen] = useState(false)

  useEffect(() => {
    if (!user) navigate('/login')
    loadSession()
    api.get<Exercise[]>('/exercises').then(({ data }) => setExercises(data))
  }, [user, navigate, id])

  async function loadSession() {
    setLoading(true)
    try {
      const s = await getWorkoutSession(id!)
      setSession(s)
    } finally {
      setLoading(false)
    }
  }

  const debouncedSave = useDebouncedCallback(
    async (setId: string, patch: Parameters<typeof updateSet>[1]) => {
      setSavingSetId(setId)
      try {
        const updated = await updateSet(setId, patch)
        setSession((prev) => {
          if (!prev) return prev
          const copy = structuredClone(prev)
          for (const ex of copy.exercises) {
            const s = ex.sets.find((ss) => ss.id === setId)
            if (s) Object.assign(s, updated)
          }
          return copy
        })
      } finally {
        setSavingSetId(null)
      }
    },
    300,
  )

  const handleInput = (setId: string, field: string, value: any) => {
    let parsed = value
    if (typeof value === 'boolean') parsed = value
    else if (field === 'notes') parsed = value
    else if (value === '' || value == null) parsed = null
    else parsed = Number(value)

    debouncedSave(setId, { [field]: parsed })

    setSession((prev) => {
      if (!prev) return prev
      const copy = structuredClone(prev)
      for (const ex of copy.exercises) {
        const s = ex.sets.find((ss) => ss.id === setId)
        if (s) (s as any)[field] = parsed
      }
      return copy
    })
  }

  const handleAddSet = async (exercise: SessionExercise) => {
    const nextIndex =
      exercise.sets.length === 0
        ? 0
        : Math.max(...exercise.sets.map((s) => s.setIndex)) + 1
    const created = await addSetToExercise(exercise.id, { setIndex: nextIndex })
    setSession((prev) => {
      if (!prev) return prev
      const copy = structuredClone(prev)
      const ex = copy.exercises.find((e) => e.id === exercise.id)
      if (ex) ex.sets.push(created)
      return copy
    })
  }

  const handleAddExercise = async (exerciseId: string) => {
    const order =
      session?.exercises?.length
        ? Math.max(...session.exercises.map((e) => e.order)) + 1
        : 0
    const created = await addExerciseToSession(session!.id, { exerciseId, order })
    setSession((prev) => {
      if (!prev) return prev
      const copy = structuredClone(prev)
      copy.exercises.push(created)
      return copy
    })
    setPickerOpen(false)
  }

  const handleFinishWorkout = async (data: FinishWorkoutData) => {
    try {
      await finishWorkoutSession(session!.id, data)
      toast({ variant: 'success', title: 'Workout finished', description: 'Good job!' })
      navigate('/app')
    } catch (err: any) {
      toast({
        variant: 'error',
        title: 'Error finishing workout',
        description: err?.message ?? 'Something went wrong.',
      })
    }
  }

  const humanDate = useMemo(() => {
    if (!session?.startAt) return ''
    return new Date(session.startAt).toLocaleString()
  }, [session?.startAt])

  if (loading || !session)
    return <p className="text-center text-gray-400 mt-10">Loading session...</p>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">{session.title}</h1>
        <p className="text-sm text-gray-400">Started on {humanDate}</p>
      </header>

      <div className="space-y-4">
        {session.exercises.map((ex) => {
          const doneCount = ex.sets.filter((s) => s.completed).length
          return (
            <div
              key={ex.id}
              className="rounded-xl border border-gray-800 bg-[#151515] overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpanded(expanded === ex.id ? null : ex.id)
                }
                className="w-full flex justify-between items-center px-4 py-3 text-left hover:bg-[#1c1c1c] transition"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-100">
                    {ex.exercise.name}
                  </h3>
                  <p className="text-xs uppercase text-gray-500">
                    {ex.exercise.muscleGroup ?? ''}
                  </p>
                </div>
                <div className="text-xs text-gray-400">
                  {doneCount}/{ex.sets.length} done
                </div>
              </button>

              {expanded === ex.id && (
                <div className="border-t border-gray-800 p-4 space-y-3">
                  {ex.sets.map((s) => (
                    <div
                      key={s.id}
                      className={`rounded-lg border p-3 transition ${
                        s.completed
                          ? 'border-green-600 bg-green-950/20'
                          : 'border-gray-800 bg-[#101010]'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-400">
                          Set {s.setIndex + 1}
                        </span>
                        <button
                          onClick={() =>
                            handleInput(s.id, 'completed', !s.completed)
                          }
                          className={`text-xs rounded-md border px-2 py-1 transition ${
                            s.completed
                              ? 'border-green-600 bg-green-700/30 text-green-300'
                              : 'border-gray-700 text-gray-300 hover:text-primary'
                          }`}
                        >
                          {s.completed ? '✓ Completed' : 'Mark as Done'}
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Load</label>
                          <input
                            type="number"
                            value={s.actualLoad ?? ''}
                            onChange={(e) =>
                              handleInput(s.id, 'actualLoad', e.target.value)
                            }
                            className="w-full rounded-md border border-gray-700 bg-[#0f0f0f] px-3 py-2 text-sm text-gray-100 focus:border-primary outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Reps</label>
                          <input
                            type="number"
                            value={s.actualReps ?? ''}
                            onChange={(e) =>
                              handleInput(s.id, 'actualReps', e.target.value)
                            }
                            className="w-full rounded-md border border-gray-700 bg-[#0f0f0f] px-3 py-2 text-sm text-gray-100 focus:border-primary outline-none"
                          />
                          {s.plannedReps != null && (
                            <p className="text-[10px] text-gray-500 mt-1">
                              Target: {s.plannedReps}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="text-xs text-gray-400 block mb-1">RIR</label>
                          <input
                            type="number"
                            value={s.actualRir ?? ''}
                            onChange={(e) =>
                              handleInput(s.id, 'actualRir', e.target.value)
                            }
                            className="w-full rounded-md border border-gray-700 bg-[#0f0f0f] px-3 py-2 text-sm text-gray-100 focus:border-primary outline-none"
                          />
                          {s.plannedRir != null && (
                            <p className="text-[10px] text-gray-500 mt-1">
                              Target: {s.plannedRir}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3">
                        <label className="text-xs text-gray-400 block mb-1">Notes</label>
                        <input
                          type="text"
                          value={s.notes ?? ''}
                          onChange={(e) =>
                            handleInput(s.id, 'notes', e.target.value)
                          }
                          className="w-full rounded-md border border-gray-700 bg-[#0f0f0f] px-3 py-2 text-sm text-gray-100 focus:border-primary outline-none"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => handleAddSet(ex)}
                    className="w-full mt-2 rounded-md border border-gray-700 py-2 text-sm text-gray-300 hover:border-primary hover:text-primary transition"
                  >
                    + Add Set
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => setPickerOpen(true)}
          className="rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:border-primary hover:text-primary transition"
        >
          + Add Exercise
        </button>
      </div>

      <div className="sticky bottom-0 left-0 right-0 z-40 -mx-4 border-t border-gray-800 bg-[#0f0f0f]/95 px-4 py-3 backdrop-blur">
        <button
          onClick={() => setFinishOpen(true)}
          className="w-full rounded-md bg-primary py-3 text-sm font-semibold text-black hover:brightness-110"
        >
          Finish Workout
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
        refreshExercises={async () => {
          const { data } = await api.get<Exercise[]>('/exercises')
          setExercises(data)
        }}
      />
    </div>
  )
}
