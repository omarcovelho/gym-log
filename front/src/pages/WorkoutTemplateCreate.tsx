import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/auth/AuthContext'
import { api } from '@/lib/api'
import { createWorkoutTemplate } from '@/api/workoutTemplates'
import { useToast } from '@/components/ToastProvider'
import { ExercisePickerModal, type Exercise } from '@/components/ExercisePickerModal'

const itemSchema = z.object({
  exerciseId: z.string().min(1, 'Select an exercise'),
  target: z.string().optional(),
})

const schema = z.object({
  title: z.string().min(2, 'Title is required'),
  items: z.array(itemSchema).min(1, 'Add at least one exercise'),
})

type Form = z.infer<typeof schema>

export default function WorkoutTemplateCreate() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loadingEx, setLoadingEx] = useState(true)
  const [errorEx, setErrorEx] = useState<string | null>(null)
  const [pickerIdx, setPickerIdx] = useState<number | null>(null)

  useEffect(() => {
    if (!user) navigate('/login')
  }, [user, navigate])

  const loadExercises = async () => {
    try {
      setLoadingEx(true)
      const { data } = await api.get<Exercise[]>('/exercises')
      setExercises(data)
    } catch (e: any) {
      setErrorEx(e?.message ?? 'Failed to load exercises')
      toast({
        variant: 'error',
        title: 'Error loading exercises',
        description: e?.message ?? 'Try again later.',
      })
    } finally {
      setLoadingEx(false)
    }
  }

  useEffect(() => {
    loadExercises()
  }, [])

  const { register, handleSubmit, control, formState } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', items: [] },
  })

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'items',
  })

  const exerciseById = useMemo(
    () => new Map(exercises.map(e => [e.id, e] as const)),
    [exercises]
  )

  const onSubmit = async (form: Form) => {
    const payload = {
      title: form.title,
      items: form.items.map((i, idx) => ({
        exerciseId: i.exerciseId,
        order: idx,
        target: i.target?.trim() || undefined,
      })),
    }

    try {
      await createWorkoutTemplate(payload)
      toast({
        variant: 'success',
        title: 'Template created',
        description: 'Your workout template was saved successfully!',
      })
      navigate('/app/templates')
    } catch (error: any) {
      toast({
        variant: 'error',
        title: 'Error creating template',
        description: error?.message ?? 'Something went wrong.',
      })
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold mb-2">New Workout Template</h1>
        <p className="text-gray-400 text-sm">
          Create your custom workout split and set targets for each exercise.
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Template Title */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Template Title
          </label>
          <input
            className="w-full border border-gray-700 bg-dark rounded-lg p-3 text-gray-100 focus:border-primary outline-none transition"
            placeholder="Push Day A, Pull Day B..."
            {...register('title')}
          />
          {formState.errors.title && (
            <p className="text-sm text-red-500 mt-1">
              {formState.errors.title.message}
            </p>
          )}
        </div>

        {/* Exercises Section */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-100">Exercises</h2>
            <button
              type="button"
              onClick={() => append({ exerciseId: '', target: '' })}
              className="text-sm bg-primary text-black px-3 py-1.5 rounded-md font-medium hover:brightness-110 transition"
            >
              + Add exercise
            </button>
          </div>

          <div className="space-y-4">
            {fields.map((f, idx) => {
              const current = exerciseById.get((f as any).exerciseId)
              return (
                <div
                  key={f.id}
                  className="
                    bg-[#181818]
                    rounded-lg
                    p-4
                    border border-gray-800
                    shadow-sm
                    space-y-3
                    transition-all
                    duration-200
                    ease-in-out
                    hover:shadow-lg
                    hover:-translate-y-0.5
                    hover:scale-[1.01]
                    hover:border-gray-600
                  "
                >
                  {/* Exercise Selector */}
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setPickerIdx(idx)}
                      className="w-full flex justify-between items-center border border-gray-700 rounded-lg px-3 py-2 bg-[#121212] text-sm text-gray-300 font-medium hover:border-primary hover:text-primary transition"
                    >
                      <div className="flex items-center gap-2">
                        <span className="opacity-70">🏋️</span>
                        {current?.name || 'Select exercise'}
                      </div>
                      <span className="text-xs text-gray-500">▼</span>
                    </button>

                    <button
                      onClick={() => remove(idx)}
                      type="button"
                      className="text-xs text-gray-500 hover:text-red-500 transition ml-3"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Target input */}
                  <input
                    {...register(`items.${idx}.target` as const)}
                    placeholder="Target (e.g. 3×10 RIR 2)"
                    className="w-full bg-[#121212] border border-gray-700 rounded-md p-2 text-sm text-gray-200 placeholder-gray-500 focus:border-primary outline-none transition"
                  />

                  {current?.muscleGroup && (
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      {current.muscleGroup}
                    </p>
                  )}

                  <ExercisePickerModal
                    open={pickerIdx === idx}
                    onClose={() => setPickerIdx(null)}
                    onSelect={(id) => {
                      update(idx, { ...f, exerciseId: id })
                      setPickerIdx(null)
                    }}
                    exercises={exercises}
                    refreshExercises={loadExercises}
                  />
                </div>
              )
            })}
          </div>
        </section>

        {/* Submit Button */}
        <div className="pt-4 border-t border-gray-800">
          <button
            type="submit"
            disabled={formState.isSubmitting}
            className="w-full py-3 rounded-md bg-primary text-black font-semibold text-sm tracking-wide hover:brightness-110 transition"
          >
            {formState.isSubmitting ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </form>
    </div>
  )
}
