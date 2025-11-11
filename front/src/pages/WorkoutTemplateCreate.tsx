import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/auth/AuthContext'
import { api } from '@/lib/api'
import { createWorkoutTemplate } from '@/api/workoutTemplates'
import { useToast } from '@/components/ToastProvider'
import { ExercisePickerModal, type Exercise } from '@/components/ExercisePickerModal'
import {
  useFieldArray,
  useForm,
  FormProvider,
  useFormContext,
  type Control,
  type UseFormRegister,
  type FormState,
} from 'react-hook-form'

/* ---------------------------- ZOD SCHEMA ---------------------------- */

const setSchema = z.object({
  setIndex: z.number().int().min(0),
  reps: z
    .number({
      required_error: 'Reps are required',
      invalid_type_error: 'Reps must be a number',
    })
    .int()
    .min(1, 'Must be at least 1 rep'),
  rir: z.number().int().optional(),
  notes: z.string().optional(),
})

const itemSchema = z.object({
  exerciseId: z.string().min(1, 'Select an exercise'),
  order: z.number().int().optional(),
  notes: z.string().optional(),
  sets: z.array(setSchema).min(1, 'Add at least one set'),
})

const schema = z.object({
  title: z.string().min(2, 'Title is required'),
  items: z.array(itemSchema).min(1, 'Add at least one exercise'),
})

type Form = z.infer<typeof schema>

/* -------------------------- SUBCOMPONENT -------------------------- */

type ExerciseBlockProps = {
  f: any
  idx: number
  control: Control<Form>
  register: UseFormRegister<Form>
  remove: (index: number) => void
  update: (index: number, value: any) => void
  exercise: Exercise | undefined
  exercises: Exercise[]
  loadExercises: () => Promise<void>
  formState: FormState<Form>
}

function ExerciseBlock({
  f,
  idx,
  control,
  register,
  remove,
  update,
  exercise,
  exercises,
  loadExercises,
  formState,
}: ExerciseBlockProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const form = useFormContext<Form>()
  const setsFA = useFieldArray({
    control,
    name: `items.${idx}.sets` as const,
  })

  return (
    <div
      key={f.id}
      className="bg-[#181818] rounded-lg p-4 border border-gray-800 space-y-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-gray-600"
    >
      {/* Exercise Selector */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className={`w-full flex justify-between items-center border rounded-lg px-3 py-2 bg-[#121212] text-sm font-medium transition ${
            formState.errors?.items?.[idx]?.exerciseId
              ? 'border-red-600 text-red-400'
              : 'border-gray-700 text-gray-300 hover:border-primary hover:text-primary'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="opacity-70">🏋️</span>
            {exercise?.name || 'Select exercise'}
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

      {/* Validation error */}
      {formState?.errors?.items?.[idx]?.exerciseId && (
        <p className="text-xs text-red-500 mt-1">
          {(formState.errors.items[idx] as any).exerciseId?.message}
        </p>
      )}

      {exercise?.muscleGroup && (
        <p className="text-xs text-gray-500 uppercase tracking-wide">{exercise.muscleGroup}</p>
      )}

      {/* Sets Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-300">Sets</h3>

        {setsFA.fields.map((sf, sidx) => {
          const setError =
            (formState.errors.items?.[idx] as any)?.sets?.[sidx]?.reps?.message

          return (
            <div
              key={sf.id}
              className="bg-[#141414] p-2 rounded-md border border-gray-800 space-y-1"
            >
              <div className="grid grid-cols-12 gap-2 items-end">
                <input
                  {...register(`items.${idx}.sets.${sidx}.reps` as const, {
                    setValueAs: (v) =>
                      v === '' || v == null || isNaN(Number(v))
                        ? undefined
                        : Number(v),
                  })}
                  type="number"
                  placeholder="Reps *"
                  className={`col-span-3 bg-[#121212] border rounded-md p-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none transition ${
                    setError
                      ? 'border-red-600 focus:border-red-600'
                      : 'border-gray-700 focus:border-primary'
                  }`}
                />

                <input
                  {...register(`items.${idx}.sets.${sidx}.rir` as const, {
                    setValueAs: (v) =>
                      v === '' || v == null || isNaN(Number(v))
                        ? undefined
                        : Number(v),
                  })}
                  type="number"
                  placeholder="RIR"
                  className="col-span-3 bg-[#121212] border border-gray-700 rounded-md p-2 text-sm text-gray-200 placeholder-gray-500 focus:border-primary outline-none transition"
                />

                <input
                  {...register(`items.${idx}.sets.${sidx}.notes` as const)}
                  placeholder="Notes"
                  className="col-span-5 bg-[#121212] border border-gray-700 rounded-md p-2 text-sm text-gray-200 placeholder-gray-500 focus:border-primary outline-none transition"
                />

                <button
                  type="button"
                  onClick={() => setsFA.remove(sidx)}
                  className="col-span-1 text-xs text-gray-500 hover:text-red-500"
                >
                  ✕
                </button>
              </div>

              {setError && (
                <p className="text-xs text-red-500 mt-0.5 ml-1">{setError}</p>
              )}
            </div>
          )
        })}

        {/* Add / Clone Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              setsFA.append({
                setIndex: setsFA.fields.length,
                reps: undefined,
                rir: undefined,
                notes: '',
              })
            }
            className="text-xs border border-gray-600 px-2 py-1 rounded hover:bg-gray-800 transition"
          >
            + Add set
          </button>

          <button
            type="button"
            onClick={() => {
              const lastIndex = setsFA.fields.length - 1
              if (lastIndex < 0) return
              const values = (control._formValues as any)?.items?.[idx]?.sets?.[lastIndex]
              if (!values) return
              setsFA.append({
                setIndex: setsFA.fields.length,
                reps: values.reps ?? undefined,
                rir: values.rir ?? undefined,
                notes: values.notes ?? '',
              })
            }}
            className="text-xs border border-gray-600 px-2 py-1 rounded hover:bg-gray-800 transition"
          >
            Clone last
          </button>
        </div>
      </div>

      {/* Exercise Picker Modal */}
      <ExercisePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(id) => {
          update(idx, { ...f, exerciseId: id })
          form?.clearErrors?.(`items.${idx}.exerciseId`) // ✅ limpa erro visual
          setPickerOpen(false)
        }}
        exercises={exercises}
        refreshExercises={loadExercises}
      />
    </div>
  )
}

/* ----------------------------- MAIN PAGE ----------------------------- */

export default function WorkoutTemplateCreate() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loadingEx, setLoadingEx] = useState(true)

  useEffect(() => {
    if (!user) navigate('/login')
  }, [user, navigate])

  const loadExercises = async () => {
    try {
      setLoadingEx(true)
      const { data } = await api.get<Exercise[]>('/exercises')
      setExercises(data)
    } finally {
      setLoadingEx(false)
    }
  }

  useEffect(() => {
    loadExercises()
  }, [])

  const methods = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', items: [] },
  })

  const { register, handleSubmit, control, formState } = methods
  const itemsFA = useFieldArray({ control, name: 'items' })
  const exerciseById = useMemo(
    () => new Map(exercises.map((e) => [e.id, e] as const)),
    [exercises]
  )

  const onSubmit = async (form: Form) => {
    const payload = {
      title: form.title,
      items: form.items.map((i, idx) => ({
        exerciseId: i.exerciseId,
        order: idx,
        notes: i.notes?.trim() || undefined,
        sets: i.sets.map((s, sidx) => ({
          setIndex: sidx,
          reps: s.reps,
          rir: s.rir,
          notes: s.notes?.trim() || undefined,
        })),
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
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-2xl mx-auto space-y-8 relative pb-32 md:pb-0"
      >
        <header>
          <h1 className="text-3xl font-bold mb-2">New Workout Template</h1>
          <p className="text-gray-400 text-sm">
            Build your custom workout — define exercises, sets, reps and RIR.
          </p>
        </header>

        {/* Title */}
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
            <p className="text-sm text-red-500 mt-1">{formState.errors.title.message}</p>
          )}
        </div>

        {/* Exercises */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-100">Exercises</h2>
            <button
              type="button"
              onClick={() =>
                itemsFA.append({
                  exerciseId: '',
                  notes: '',
                  sets: [{ setIndex: 0, reps: undefined, rir: undefined, notes: '' }],
                })
              }
              className="text-sm bg-primary text-black px-3 py-1.5 rounded-md font-medium hover:brightness-110 transition"
            >
              + Add exercise
            </button>
          </div>

          <div className="space-y-5">
            {itemsFA.fields.map((f, idx) => (
              <ExerciseBlock
                key={f.id}
                f={f}
                idx={idx}
                control={control}
                register={register}
                remove={itemsFA.remove}
                update={itemsFA.update}
                exercise={exerciseById.get((f as any).exerciseId)}
                exercises={exercises}
                loadExercises={loadExercises}
                formState={formState}
              />
            ))}
          </div>
        </section>

        <div className="h-28 md:hidden" />

        {/* Sticky Save Button */}
        <div
          className="
            fixed bottom-0 left-0 right-0 z-40
            bg-[#0f0f0f]/95 backdrop-blur-md
            px-4 py-3 border-t border-gray-800
            md:static md:px-0 md:py-0 md:border-none md:bg-transparent md:backdrop-blur-none
          "
        >
          <div className="max-w-2xl mx-auto">
            <button
              type="submit"
              disabled={formState.isSubmitting}
              className="
                w-full py-3 rounded-md
                bg-primary text-black font-semibold text-sm
                tracking-wide hover:brightness-110 transition
                disabled:opacity-70
              "
            >
              {formState.isSubmitting ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </div>
      </form>
    </FormProvider>
  )
}
