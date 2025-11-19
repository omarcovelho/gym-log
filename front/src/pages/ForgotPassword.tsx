import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { forgotPassword } from '@/api/auth'
import { useState } from 'react'

const getSchema = () => z.object({
  email: z.string().email(),
})

type Form = z.infer<ReturnType<typeof getSchema>>

export default function ForgotPassword() {
  const { t } = useTranslation()
  const [isSuccess, setIsSuccess] = useState(false)
  const { register, handleSubmit, formState } = useForm<Form>({
    resolver: zodResolver(getSchema()),
  })

  async function onSubmit(data: Form) {
    try {
      await forgotPassword(data.email)
      setIsSuccess(true)
    } catch (error) {
      // Always show success for security (don't reveal if email exists)
      setIsSuccess(true)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-dark text-gray-100 p-6">
        <div className="w-full max-w-sm border border-gray-700 p-6 rounded-lg space-y-4">
          <h1 className="text-2xl font-bold text-primary text-center">
            {t('passwordReset.emailSent')}
          </h1>
          <p className="text-sm text-gray-400 text-center">
            {t('passwordReset.emailSentDescription')}
          </p>
          <a
            href="/login"
            className="block w-full bg-primary text-black p-2 rounded font-semibold hover:bg-green-400 transition text-center"
          >
            {t('auth.login')}
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-dark text-gray-100 p-6">
      <div className="w-full max-w-sm border border-gray-700 p-6 rounded-lg space-y-4">
        <h1 className="text-2xl font-bold text-primary text-center">
          {t('passwordReset.forgotPasswordTitle')}
        </h1>
        <p className="text-sm text-gray-400 text-center">
          {t('passwordReset.forgotPasswordDescription')}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <input
            className="w-full border p-2 rounded bg-dark border-gray-700 text-base"
            placeholder={t('auth.email')}
            type="email"
            {...register('email')}
          />
          {formState.errors.email && (
            <p className="text-sm text-red-500">{formState.errors.email.message}</p>
          )}

          <button
            disabled={formState.isSubmitting}
            className="w-full bg-primary text-black p-2 rounded font-semibold hover:bg-green-400 transition"
          >
            {formState.isSubmitting ? '...' : t('passwordReset.forgotPassword')}
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

