import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '@/lib/api'
import { useToast } from '@/components/ToastProvider'
import { useAuth } from '@/auth/AuthContext'
import { useInvalidateExercises } from '@/api/exercise'

/* ---------------------------- Schema ---------------------------- */

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  muscleGroup: z.string().optional(),
  notes: z.string().optional(),
})

type Form = z.infer<typeof schema>

/* ---------------------------- Component ---------------------------- */

export default function ExerciseCreateEdit() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()
  const invalidateExercises = useInvalidateExercises()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
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
            title: 'Access denied',
            description:
              data.isGlobal === true
                ? 'Only admins can edit global exercises.'
                : 'You can only edit your own exercises.',
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
          title: 'Exercise updated',
          description: 'Changes were saved successfully.',
        })
      } else {
        await api.post('/exercises', form)
        toast({
          variant: 'success',
          title: 'Exercise created',
          description: 'Your new exercise was added successfully.',
        })
      }
      invalidateExercises()
      navigate('/app/exercises')
    } catch (err: any) {
      toast({
        variant: 'error',
        title: 'Error',
        description: err?.message ?? 'Something went wrong.',
      })
    }
  }

  /* ---------------------------- UI ---------------------------- */

  useEffect(() => {
    if (!user) navigate('/login')
  }, [user, navigate])

  return (
    <div className="max-w-2xl mx-auto space-y-8 relative pb-32 md:pb-0">
      <header>
        <h1 className="text-3xl font-bold mb-2">
          {isEditing ? 'Edit Exercise' : 'New Exercise'}
        </h1>
        <p className="text-gray-400 text-sm">
          Define your exercise name, group, and optional notes.
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Name
          </label>
          <input
            {...register('name')}
            placeholder="Exercise name"
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
            Muscle Group
          </label>
          <select
            {...register('muscleGroup')}
            className="w-full border border-gray-700 bg-dark rounded-lg p-3 text-gray-100 focus:border-primary outline-none transition"
          >
            <option value="">Select group</option>
            {[
              ['CHEST', 'Chest'],
              ['BACK', 'Back'],
              ['LEGS', 'Legs'],
              ['SHOULDERS', 'Shoulders'],
              ['BICEPS', 'Biceps'],
              ['TRICEPS', 'Triceps'],
              ['CORE', 'Core'],
              ['FULL_BODY', 'Full Body'],
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
            Notes
          </label>
          <textarea
            {...register('notes')}
            placeholder="Optional notes about this exercise..."
            className="w-full border border-gray-700 bg-dark rounded-lg p-3 text-base text-gray-100 focus:border-primary outline-none transition"
            rows={4}
          />
        </div>

        {/* Save Button */}
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
              disabled={isSubmitting}
              className="
                w-full py-3 rounded-md
                bg-primary text-black font-semibold text-sm
                tracking-wide hover:brightness-110 transition
                disabled:opacity-70
              "
            >
              {isSubmitting
                ? 'Saving...'
                : isEditing
                ? 'Save Changes'
                : 'Save Exercise'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
