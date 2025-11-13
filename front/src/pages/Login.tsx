import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '@/lib/api'
import { useAuth } from '@/auth/AuthContext'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})
type Form = z.infer<typeof schema>

export default function Login() {
  const { login } = useAuth()
  const { register, handleSubmit, formState } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  const API_URL = import.meta.env.VITE_API_URL
  const FRONTEND_ORIGIN = window.location.origin
  const API_ORIGIN = new URL(API_URL).origin

  async function onSubmit(data: Form) {
    const res = await api.post('/auth/login', data)
    const token = res.data.access_token

    login(token, { sub: 'me', email: data.email })
    location.href = '/app'
  }

  function handleGoogleLogin() {
    const width = 500
    const height = 600
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2

    const popup = window.open(
      `${API_URL}/auth/google`,
      'google-login',
      `width=${width},height=${height},left=${left},top=${top}`
    )

    if (!popup) return

    const listener = (event: MessageEvent) => {
      // segurança — só aceita do backend
      if (event.origin !== API_ORIGIN) return

      const { token, email, name } = event.data || {}
      if (!token) return

      // salva no auth context
      login(token, { sub: 'google', email, name })

      window.removeEventListener('message', listener)
      popup.close()
      location.href = '/app'
    }

    window.addEventListener('message', listener)
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-dark text-gray-100 p-6">
      <div className="w-full max-w-sm border border-gray-700 p-6 rounded-lg space-y-4">
        <h1 className="text-2xl font-bold text-primary text-center">Login</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <input
            className="w-full border p-2 rounded bg-dark border-gray-700"
            placeholder="Email"
            {...register('email')}
          />
          {formState.errors.email && (
            <p className="text-sm text-red-500">{formState.errors.email.message}</p>
          )}

          <input
            className="w-full border p-2 rounded bg-dark border-gray-700"
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
            {formState.isSubmitting ? '...' : 'Login'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 pt-2">
          <div className="flex-1 h-px bg-gray-700" />
          <span className="text-gray-500 text-xs">OR</span>
          <div className="flex-1 h-px bg-gray-700" />
        </div>

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-red-500 text-white p-2 rounded font-semibold hover:bg-red-600 transition"
        >
          Login with Google
        </button>

        <p className="text-sm text-gray-400 text-center">
          Don’t have an account?{' '}
          <a href="/signup" className="text-primary hover:underline">
            Sign up for free
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
