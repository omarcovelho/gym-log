import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '@/lib/api'

const muscles = ['CHEST','BACK','SHOULDERS','LEGS','BICEPS','TRICEPS','CORE','FULLBODY','OTHER'] as const
const schema = z.object({
  name: z.string().min(2),
  muscleGroup: z.enum(muscles).optional(),
  notes: z.string().optional(),
})
type Form = z.infer<typeof schema>

export default function ExercisesCreate() {
  const { register, handleSubmit, formState } = useForm<Form>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: Form) => {
    await api.post('/exercises', data)
    alert('Exercise created')
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold">New Exercise</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <input className="w-full border p-2 rounded bg-dark border-gray-700" placeholder="Name" {...register('name')} />
        {formState.errors.name && <p className="text-sm text-red-600">{formState.errors.name.message}</p>}

        <select className="w-full border p-2 rounded bg-dark border-gray-700" {...register('muscleGroup')}>
          <option value="">Select group</option>
          {muscles.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        <textarea className="w-full border p-2 rounded bg-dark border-gray-700" placeholder="Notes" rows={3} {...register('notes')} />

        <button disabled={formState.isSubmitting} className="px-4 py-2 rounded bg-primary text-black font-semibold">
          {formState.isSubmitting ? '...' : 'Save'}
        </button>
      </form>
    </div>
  )
}
