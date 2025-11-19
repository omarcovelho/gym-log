import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { resetPassword } from '@/api/auth'
import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

const getSchema = () => z.object({
  newPassword: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'passwordsMustMatch',
  path: ['confirmPassword'],
})

type Form = z.infer<ReturnType<typeof getSchema>>

export default function ResetPassword() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const token = searchParams.get('token')

  const { register, handleSubmit, formState, setError: setFormError } = useForm<Form>({
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
      await resetPassword(token, data.newPassword)
      setIsSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'tokenInvalid'
      if (errorMessage.includes('expired') || errorMessage.includes('expirou')) {
        setError('tokenExpired')
      } else {
        setError('tokenInvalid')
      }
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-dark text-gray-100 p-6">
        <div className="w-full max-w-sm border border-gray-700 p-6 rounded-lg space-y-4">
          <h1 className="text-2xl font-bold text-primary text-center">
            {t('passwordReset.passwordResetSuccess')}
          </h1>
          <p className="text-sm text-gray-400 text-center">
            {t('passwordReset.passwordResetSuccessDescription')}
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
            {t(`passwordReset.${error}`)}
          </h1>
          <p className="text-sm text-gray-400 text-center">
            {t(`passwordReset.${error}Description`)}
          </p>
          <a
            href="/forgot-password"
            className="block w-full bg-primary text-black p-2 rounded font-semibold hover:bg-green-400 transition text-center"
          >
            {t('passwordReset.forgotPassword')}
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
          {t('passwordReset.resetPasswordTitle')}
        </h1>
        <p className="text-sm text-gray-400 text-center">
          {t('passwordReset.resetPasswordDescription')}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <input
            className="w-full border p-2 rounded bg-dark border-gray-700 text-base"
            type="password"
            placeholder={t('passwordReset.newPassword')}
            {...register('newPassword')}
          />
          {formState.errors.newPassword && (
            <p className="text-sm text-red-500">{formState.errors.newPassword.message}</p>
          )}

          <input
            className="w-full border p-2 rounded bg-dark border-gray-700 text-base"
            type="password"
            placeholder={t('passwordReset.confirmPassword')}
            {...register('confirmPassword')}
          />
          {formState.errors.confirmPassword && (
            <p className="text-sm text-red-500">
              {formState.errors.confirmPassword.message === 'passwordsMustMatch'
                ? t('passwordReset.passwordsMustMatch')
                : formState.errors.confirmPassword.message}
            </p>
          )}

          <button
            disabled={formState.isSubmitting}
            className="w-full bg-primary text-black p-2 rounded font-semibold hover:bg-green-400 transition"
          >
            {formState.isSubmitting ? '...' : t('passwordReset.resetPassword')}
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

