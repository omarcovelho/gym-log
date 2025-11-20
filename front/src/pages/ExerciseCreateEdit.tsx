import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { useToast } from '@/components/ToastProvider'
import { useAuth } from '@/auth/AuthContext'
import { useInvalidateExercises } from '@/api/exercise'

/* ---------------------------- Schema ---------------------------- */

/* ---------------------------- Component ---------------------------- */

export default function ExerciseCreateEdit() {
  const { t } = useTranslation()
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()
  const invalidateExercises = useInvalidateExercises()

  const getSchema = () => z.object({
    name: z.string().min(2, t('validation.exerciseNameMin')),
    muscleGroup: z.string().optional(),
    notes: z.string().optional(),
  })

  type Form = z.infer<ReturnType<typeof getSchema>>

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(getSchema()),
    defaultValues: { name: '', muscleGroup: '', notes: '' },
  })

  /* ---------------------------- Load for Edit ---------------------------- */

  useEffect(() => {
    if (isEditing && id && user) {
      api.get(`/exercises/${id}`).then(({ data }) => {
        // Check permissions
        const canEdit =
          data.isGlobal === true
            ? user.role === 'ADMIN'
            : data.createdById === user.sub || user.role === 'ADMIN'

        if (!canEdit) {
          toast({
            variant: 'error',
            title: t('exercise.accessDenied'),
            description:
              data.isGlobal === true
                ? t('exercise.onlyAdminsCanEdit')
                : t('exercise.onlyOwnExercises'),
          })
          navigate('/app/exercises')
          return
        }

        reset({
          name: data.name ?? '',
          muscleGroup: data.muscleGroup ?? '', // ✅ handles enum correctly
          notes: data.notes ?? '',
        })
      })
    }
  }, [id, isEditing, reset, user, navigate, toast])

  /* ---------------------------- Submit ---------------------------- */

  const onSubmit = async (form: Form) => {
    try {
      if (isEditing) {
        await api.put(`/exercises/${id}`, form)
        toast({
          variant: 'success',
          title: t('exercise.exerciseUpdated'),
          description: t('exercise.exerciseUpdatedDescription'),
        })
      } else {
        await api.post('/exercises', form)
        toast({
          variant: 'success',
          title: t('exercise.exerciseCreated'),
          description: t('exercise.exerciseCreatedDescription'),
        })
      }
      invalidateExercises()
      navigate('/app/exercises')
    } catch (err: any) {
      toast({
        variant: 'error',
        title: t('common.error'),
        description: err?.message ?? t('exercise.deleteFailedDescription'),
      })
    }
  }

  /* ---------------------------- UI ---------------------------- */

  useEffect(() => {
    if (!user) navigate('/login')
  }, [user, navigate])

  return (
    <div className="max-w-2xl mx-auto space-y-8 relative">
      <header>
        <h1 className="text-3xl font-bold mb-2">
          {isEditing ? t('exercise.editExercise') : t('exercise.newExercise')}
        </h1>
        <p className="text-gray-400 text-sm">
          {t('exercise.defineExercise')}
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {t('exercise.name')}
          </label>
          <input
            {...register('name')}
            placeholder={t('exercise.exerciseNamePlaceholder')}
            className={`w-full border rounded-lg p-3 bg-dark text-base text-gray-100 focus:outline-none transition
              ${errors.name ? 'border-red-600' : 'border-gray-700 focus:border-primary'}
            `}
          />
          {errors.name && (
            <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Muscle Group */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {t('exercise.muscleGroup')}
          </label>
          <select
            {...register('muscleGroup')}
            className="w-full border border-gray-700 bg-dark rounded-lg p-3 text-gray-100 focus:border-primary outline-none transition"
          >
            <option value="">{t('exercise.selectGroup')}</option>
            {[
              ['CHEST', t('muscleGroups.CHEST')],
              ['BACK', t('muscleGroups.BACK')],
              ['LEGS', t('muscleGroups.LEGS')],
              ['SHOULDERS', t('muscleGroups.SHOULDERS')],
              ['BICEPS', t('muscleGroups.BICEPS')],
              ['TRICEPS', t('muscleGroups.TRICEPS')],
              ['CORE', t('muscleGroups.CORE')],
              ['FULL_BODY', t('muscleGroups.FULL_BODY')],
            ].map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {t('exercise.notes')}
          </label>
          <textarea
            {...register('notes')}
            placeholder={t('exercise.optionalNotes')}
            className="w-full border border-gray-700 bg-dark rounded-lg p-3 text-base text-gray-100 focus:border-primary outline-none transition"
            rows={4}
          />
        </div>

      {/* FOOTER */}
      <div className="sticky bottom-0 left-0 right-0 bg-[#0f0f0f]/95 border-t border-gray-800 px-4 py-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary text-black py-3 rounded-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('common.saving')}
            </>
          ) : isEditing ? (
            t('exercise.saveChanges')
          ) : (
            t('exercise.saveExercise')
          )}
        </button>
      </div>
      </form>
    </div>
  )
}
