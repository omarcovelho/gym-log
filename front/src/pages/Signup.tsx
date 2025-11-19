import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '@/lib/api'
import { useAuth } from '@/auth/AuthContext'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
})
type Form = z.infer<typeof schema>

export default function Signup() {
  const { login } = useAuth()
  const { register, handleSubmit, formState } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: Form) => {
    // Signup
    await api.post('/auth/signup', data)
    
    // Auto login after signup
    const loginRes = await api.post('/auth/login', {
      email: data.email,
      password: data.password,
    })
    
    const token = loginRes.data.access_token
    const userData = loginRes.data.user

    login(token, {
      sub: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
    })
    
    // Redirect to stats page
    location.href = '/app/stats'
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-dark text-gray-100 p-6">
      <div className="w-full max-w-sm border border-gray-700 p-6 rounded-lg space-y-4">
        <h1 className="text-2xl font-bold text-primary text-center">Sign Up</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <input
            className="w-full border p-2 rounded bg-dark border-gray-700 text-base"
            placeholder="Email"
            {...register('email')}
          />
          {formState.errors.email && (
            <p className="text-sm text-red-500">{formState.errors.email.message}</p>
          )}

          <input
            className="w-full border p-2 rounded bg-dark border-gray-700 text-base"
            placeholder="Name (optional)"
            {...register('name')}
          />

          <input
            className="w-full border p-2 rounded bg-dark border-gray-700 text-base"
            type="password"
            placeholder="Password"
            {...register('password')}
          />
          {formState.errors.password && (
            <p className="text-sm text-red-500">
              {formState.errors.password.message}
            </p>
          )}

          <button
            disabled={formState.isSubmitting}
            className="w-full bg-primary text-black p-2 rounded font-semibold hover:bg-green-400 transition"
          >
            {formState.isSubmitting ? '...' : 'Create Account'}
          </button>
        </form>

        <p className="text-sm text-gray-400 text-center">
          Already have an account?{' '}
          <a href="/login" className="text-primary hover:underline">
            Login here
          </a>
        </p>

        <p className="text-xs text-gray-600 text-center">
          Back to{' '}
          <a href="/" className="hover:text-primary">
            home
          </a>
        </p>
      </div>
    </div>
  )
}
