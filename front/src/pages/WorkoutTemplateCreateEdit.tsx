/* ===============================================================
   WORKOUT TEMPLATE CREATE / EDIT — WITH VISIBLE REORDER BUTTONS
   =============================================================== */

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/auth/AuthContext'
import { api } from '@/lib/api'
import {
  createWorkoutTemplate,
  updateWorkoutTemplate,
} from '@/api/workoutTemplates'
import { useToast } from '@/components/ToastProvider'
import { ExercisePickerModal } from '@/components/ExercisePickerModal'
import { type Exercise } from '@/api/exercise'
import {
  useFieldArray,
  useForm,
  FormProvider,
  useFormContext,
  type Control,
  type UseFormRegister,
  type FormState,
} from 'react-hook-form'

/* ===============================================================
   SCHEMA
   =============================================================== */

const getSetSchema = (t: any) => z.object({
  setIndex: z.number().int().min(0),
  reps: z.preprocess((val) => {
    if (typeof val === 'string') {
      const num = Number(val)
      return isNaN(num) ? 0 : num
    }
    return typeof val === 'number' ? val : 0
  }, z.number().int().min(1, t('validation.repsMin'))),
  rir: z.number().int().optional(),
  notes: z.string().optional(),
})

const getItemSchema = (t: any) => z.object({
  exerciseId: z.string().min(1, t('validation.selectExercise')),
  order: z.number().int().optional(),
  notes: z.string().optional(),
  sets: z.array(getSetSchema(t)).min(1, t('validation.atLeastOneSet')),
})

const getSchema = (t: any) => z.object({
  title: z.string().min(2, t('validation.templateTitleMin')),
  items: z.array(getItemSchema(t)).min(1, t('validation.atLeastOneExercise')),
})

type Form = z.infer<ReturnType<typeof getSchema>>

/* ===============================================================
   EXERCISE BLOCK
   =============================================================== */

type ExerciseBlockProps = {
  f: any
  idx: number
  control: Control<Form>
  register: UseFormRegister<Form>
  remove: (index: number) => void
  update: (index: number, value: any) => void
  exercise: Exercise | undefined
  exercises: Exercise[]
  formState: FormState<Form>
  onMoveUp: () => void
  onMoveDown: () => void
  isFirst: boolean
  isLast: boolean
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
  formState,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: ExerciseBlockProps) {
  const { t } = useTranslation()
  const [pickerOpen, setPickerOpen] = useState(false)
  const form = useFormContext<Form>()
  const setsFA = useFieldArray({
    control,
    name: `items.${idx}.sets`,
  })

  return (
    <div className="bg-[#181818] rounded-lg p-4 border border-gray-800 space-y-4">

      {/* HEADER DO EXERCÍCIO + REORDER BUTTONS */}
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className={`flex-1 flex justify-between items-center border rounded-lg px-3 py-2 bg-[#121212] text-sm font-medium transition ${
            formState.errors?.items?.[idx]?.exerciseId
              ? 'border-red-600 text-red-400'
              : 'border-gray-700 text-gray-300 hover:border-primary hover:text-primary'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>🏋️</span>
            {exercise?.name || t('templates.selectExercise')}
          </div>
          <span className="text-xs text-gray-500">▼</span>
        </button>

        {/* BOTÕES DE REORDER — AGORA VISÍVEIS */}
        <div className="flex flex-col ml-3 gap-1">
          <button
            type="button"
            disabled={isFirst}
            onClick={onMoveUp}
            className={`text-[10px] px-2 py-1 rounded border ${
              isFirst
                ? 'opacity-30 cursor-not-allowed border-gray-800 text-gray-600'
                : 'border-gray-700 text-gray-300 hover:border-primary hover:text-primary'
            }`}
          >
            ↑
          </button>

          <button
            type="button"
            disabled={isLast}
            onClick={onMoveDown}
            className={`text-[10px] px-2 py-1 rounded border ${
              isLast
                ? 'opacity-30 cursor-not-allowed border-gray-800 text-gray-600'
                : 'border-gray-700 text-gray-300 hover:border-primary hover:text-primary'
            }`}
          >
            ↓
          </button>
        </div>

        <button
          onClick={() => remove(idx)}
          type="button"
          className="ml-3 text-xs text-gray-500 hover:text-red-500"
        >
          ✕
        </button>
      </div>

      {exercise?.muscleGroup && (
        <p className="text-xs text-gray-500 uppercase tracking-wide">{exercise.muscleGroup}</p>
      )}

      {/* NOTES */}
      <div>
        <label className="text-xs text-gray-400">{t('templates.notes')}</label>
        <input
          {...register(`items.${idx}.notes`)}
          placeholder={t('templates.notesPlaceholder')}
          className="w-full bg-[#121212] border border-gray-700 rounded-md p-2 text-base text-gray-200 placeholder-gray-500 focus:border-primary outline-none transition"
        />
      </div>

      {/* SETS */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-300">{t('templates.sets')}</h3>

        {setsFA.fields.map((sf, sidx) => {
          const setError = (formState.errors.items?.[idx] as any)?.sets?.[sidx]?.reps?.message

          return (
            <div key={sf.id} className="bg-[#141414] p-2 rounded-md border border-gray-800">
              <div className="grid grid-cols-12 gap-2 items-end">
                <input
                  {...register(`items.${idx}.sets.${sidx}.reps`, {
                    setValueAs: (v) =>
                    v === '' || v == null || isNaN(Number(v)) ? "" : Number(v),
                })}
                  type="number"
                  placeholder={t('templates.reps')}
                  className={`col-span-3 bg-[#121212] border rounded-md p-2 text-base ${
                    setError
                      ? 'border-red-600'
                      : 'border-gray-700 focus:border-primary'
                  }`}
                />

                <input
                  {...register(`items.${idx}.sets.${sidx}.rir`, {
                        setValueAs: (v) =>
                        v === '' || v == null || isNaN(Number(v)) ? "" : Number(v),
                    })}
                  type="number"
                  placeholder={t('workout.rir')}
                  className="col-span-3 bg-[#121212] border border-gray-700 rounded-md p-2 text-base"
                />

                <input
                  {...register(`items.${idx}.sets.${sidx}.notes`)}
                  placeholder={t('templates.setNotes')}
                  className="col-span-5 bg-[#121212] border border-gray-700 rounded-md p-2 text-base"
                />

                <button
                  type="button"
                  onClick={() => setsFA.remove(sidx)}
                  className="col-span-1 text-xs text-gray-500 hover:text-red-500"
                >
                  ✕
                </button>
              </div>

              {setError && <p className="text-xs text-red-500 mt-1">{setError}</p>}
            </div>
          )
        })}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              setsFA.append({
                setIndex: setsFA.fields.length,
                reps: 0,
                rir: undefined,
                notes: '',
              })
            }
            className="text-xs border border-gray-600 px-2 py-1 rounded hover:bg-gray-800"
          >
            {t('templates.addSet')}
          </button>

          <button
            type="button"
            onClick={() => {
              const last = setsFA.fields.at(-1)
              if (!last) return
              const values = (control._formValues as any)?.items?.[idx]?.sets?.[setsFA.fields.length - 1]
              setsFA.append({
                setIndex: setsFA.fields.length,
                reps: typeof values?.reps === 'number' ? values.reps : 0,
                rir: typeof values?.rir === 'number' ? values.rir : undefined,
                notes: typeof values?.notes === 'string' ? values.notes : '',
              })
            }}
            className="text-xs border border-gray-600 px-2 py-1 rounded hover:bg-gray-800"
          >
            {t('templates.cloneLast')}
          </button>
        </div>
      </div>

      <ExercisePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(id) => {
          update(idx, { ...f, exerciseId: id })
          form.clearErrors?.(`items.${idx}.exerciseId`)
          setPickerOpen(false)
        }}
        exercises={exercises}
      />
    </div>
  )
}

/* ===============================================================
   MAIN PAGE
   =============================================================== */

export default function WorkoutTemplateCreateEdit() {
  const { t } = useTranslation()
  const { id } = useParams()
  const isEditing = Boolean(id)
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [exercises, setExercises] = useState<Exercise[]>([])
  const methods = useForm<Form>({
    resolver: zodResolver(getSchema(t)) as any,
    defaultValues: { title: '', items: [] },
  })

  const { register, handleSubmit, control, formState, reset } = methods
  const itemsFA = useFieldArray({ control, name: 'items' })

  useEffect(() => {
    if (!user) navigate('/login')

    api.get('/exercises', { params: { page: 1, limit: 100 } }).then(({ data }) => {
      // Extrair array de data.data se for estrutura paginada, senão usar data diretamente
      const exercises = data.data && Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : [])
      setExercises(exercises)
    })

    if (isEditing) {
      api.get(`/workout-templates/${id}`).then(({ data }) => {
        reset({
          title: data.title,
          items: data.items.map((it: any) => ({
            exerciseId: it.exerciseId,
            notes: it.notes ?? '',
            sets: it.sets.map((s: any, sidx: number) => ({
              setIndex: sidx,
              reps: s.reps,
              rir: s.rir,
              notes: s.notes,
            })),
          })),
        })
      })
    }
  }, [user])

  const exerciseById = useMemo(
    () => new Map(exercises.map((e) => [e.id, e] as const)),
    [exercises],
  )

  const onSubmit = async (form: Form) => {
    const payload = {
      title: form.title,
      items: form.items.map((i, idx) => ({
        exerciseId: i.exerciseId,
        order: idx,
        notes: i.notes,
        sets: i.sets.map((s, sidx) => ({
          setIndex: sidx,
          reps: s.reps,
          rir: s.rir,
          notes: s.notes,
        })),
      })),
    }

    try {
      if (isEditing) {
        await updateWorkoutTemplate(id!, payload)
      } else {
        await createWorkoutTemplate(payload)
      }
      navigate('/app/templates')
    } catch (e: any) {
      toast({ variant: 'error', title: t('common.error'), description: e.message })
    }
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit as any)} className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">{t('templates.workoutTemplate')}</h1>

        <div>
          <label className="text-sm font-medium text-gray-300">{t('templates.title')}</label>
          <input
            {...register('title')}
            placeholder={t('templates.titlePlaceholder')}
            className="w-full bg-[#121212] border border-gray-700 rounded-lg p-3 mt-1 text-base text-gray-200"
          />
        </div>

        <h2 className="text-xl font-semibold mt-6">{t('templates.exercises')}</h2>

        <div className="space-y-5">
          {itemsFA.fields.map((f, idx) => (
            <ExerciseBlock
              key={f.id}
              f={f}
              idx={idx}
              control={control as any}
              register={register}
              remove={itemsFA.remove}
              update={itemsFA.update}
              exercise={exerciseById.get((f as any).exerciseId)}
              exercises={exercises}
              formState={formState}
              onMoveUp={() => itemsFA.swap(idx, idx - 1)}
              onMoveDown={() => itemsFA.swap(idx, idx + 1)}
              isFirst={idx === 0}
              isLast={idx === itemsFA.fields.length - 1}
            />
          ))}
        </div>

        <div className="flex justify-center mt-4">
          <button
            type="button"
            onClick={() =>
              itemsFA.append({
                exerciseId: '',
                notes: '',
                sets: [{ setIndex: 0, reps: 0, rir: undefined, notes: '' }],
              })
            }
            className="border border-gray-700 px-4 py-2 rounded text-sm text-gray-300 hover:text-primary hover:border-primary"
          >
            {t('templates.addExercise')}
          </button>
        </div>

      {/* FOOTER */}
      <div className="sticky bottom-0 left-0 right-0 bg-[#0f0f0f]/95 border-t border-gray-800 px-4 py-3">
        <button
          type="submit"
          className="w-full bg-primary text-black py-3 rounded-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {t('templates.saveTemplate')}
        </button>
      </div>
      </form>
    </FormProvider>
  )
}
