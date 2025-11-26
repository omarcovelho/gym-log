import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { confirmSignup } from '@/api/auth'
import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { useToast } from '@/components/ToastProvider'

const getSchema = () => z.object({
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
  name: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'passwordsMustMatch',
  path: ['confirmPassword'],
})

type Form = z.infer<ReturnType<typeof getSchema>>

export default function ConfirmSignup() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const token = searchParams.get('token')

  const { register, handleSubmit, formState } = useForm<Form>({
    resolver: zodResolver(getSchema()),
  })

  useEffect(() => {
    if (!token) {
      setError('tokenInvalid')
    }
  }, [token])

  async function onSubmit(data: Form) {
    if (!token) {
      setError('tokenInvalid')
      return
    }

    try {
      const response = await confirmSignup(token, data.password, data.name)
      
      // Auto login after confirmation
      login(response.access_token, {
        sub: response.user.id,
        email: response.user.email,
        name: response.user.name,
        role: response.user.role,
      })

      setIsSuccess(true)
      toast({
        variant: 'success',
        title: t('auth.signupConfirmed', 'Cadastro confirmado!'),
        description: t('auth.welcomeMessage', 'Bem-vindo ao GymLog!'),
      })

      setTimeout(() => {
        navigate('/app/stats')
      }, 2000)
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'tokenInvalid'
      if (errorMessage.includes('expired') || errorMessage.includes('expirou')) {
        setError('tokenExpired')
      } else if (errorMessage.includes('already') || errorMessage.includes('já')) {
        setError('emailAlreadyRegistered')
      } else {
        setError('tokenInvalid')
      }
      toast({
        variant: 'error',
        title: t('auth.error', 'Erro'),
        description: errorMessage,
      })
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-dark text-gray-100 p-6">
        <div className="w-full max-w-sm border border-gray-700 p-6 rounded-lg space-y-4">
          <h1 className="text-2xl font-bold text-primary text-center">
            {t('auth.signupConfirmed', 'Cadastro confirmado!')}
          </h1>
          <p className="text-sm text-gray-400 text-center">
            {t('auth.redirecting', 'Redirecionando...')}
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-dark text-gray-100 p-6">
        <div className="w-full max-w-sm border border-gray-700 p-6 rounded-lg space-y-4">
          <h1 className="text-2xl font-bold text-red-500 text-center">
            {t(`auth.${error}`, error)}
          </h1>
          <p className="text-sm text-gray-400 text-center">
            {t(`auth.${error}Description`, 'Erro ao confirmar cadastro.')}
          </p>
          <a
            href="/signup"
            className="block w-full bg-primary text-black p-2 rounded font-semibold hover:bg-green-400 transition text-center"
          >
            {t('auth.tryAgain', 'Tentar novamente')}
          </a>
          <p className="text-sm text-gray-400 text-center">
            <a href="/login" className="text-primary hover:underline">
              {t('auth.backToLogin')}
            </a>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-dark text-gray-100 p-6">
      <div className="w-full max-w-sm border border-gray-700 p-6 rounded-lg space-y-4">
        <h1 className="text-2xl font-bold text-primary text-center">
          {t('auth.confirmSignup', 'Confirmar cadastro')}
        </h1>
        <p className="text-sm text-gray-400 text-center">
          {t('auth.confirmSignupDescription', 'Defina sua senha para completar o cadastro.')}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <input
            className="w-full border p-2 rounded bg-dark border-gray-700 text-base"
            placeholder={t('auth.nameOptional', 'Nome (opcional)')}
            {...register('name')}
          />

          <input
            className="w-full border p-2 rounded bg-dark border-gray-700 text-base"
            type="password"
            placeholder={t('auth.password', 'Senha')}
            {...register('password')}
          />
          {formState.errors.password && (
            <p className="text-sm text-red-500">{formState.errors.password.message}</p>
          )}

          <input
            className="w-full border p-2 rounded bg-dark border-gray-700 text-base"
            type="password"
            placeholder={t('auth.confirmPassword', 'Confirmar senha')}
            {...register('confirmPassword')}
          />
          {formState.errors.confirmPassword && (
            <p className="text-sm text-red-500">
              {formState.errors.confirmPassword.message === 'passwordsMustMatch'
                ? t('auth.passwordsMustMatch', 'As senhas devem coincidir')
                : formState.errors.confirmPassword.message}
            </p>
          )}

          <button
            disabled={formState.isSubmitting}
            className="w-full bg-primary text-black p-2 rounded font-semibold hover:bg-green-400 transition text-center"
          >
            {formState.isSubmitting ? '...' : t('auth.confirmAndCreateAccount', 'Confirmar e criar conta')}
          </button>
        </form>

        <p className="text-sm text-gray-400 text-center">
          <a href="/login" className="text-primary hover:underline">
            {t('auth.backToLogin')}
          </a>
        </p>
      </div>
    </div>
  )
}

