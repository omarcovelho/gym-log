import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { requestSignup } from '@/api/auth'
import { useToast } from '@/components/ToastProvider'
import { useAuth } from '@/auth/AuthContext'

const schema = z.object({
  email: z.string().email(),
})
type Form = z.infer<typeof schema>

export default function Signup() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const { toast } = useToast()
  const [emailSent, setEmailSent] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState<string>('')
  const { register, handleSubmit, formState } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  // Get API URL with fallback
  const API_URL = import.meta.env.VITE_API_URL || '/api'
  
  // Safely extract origin from API URL
  let API_ORIGIN: string
  try {
    if (API_URL.startsWith('http://') || API_URL.startsWith('https://')) {
      // Absolute URL - extract origin
      API_ORIGIN = new URL(API_URL).origin
    } else {
      // Relative URL - use current origin
      API_ORIGIN = window.location.origin
    }
  } catch {
    // Fallback to current origin if URL parsing fails
    API_ORIGIN = window.location.origin
  }

  const onSubmit = async (data: Form) => {
    try {
      await requestSignup(data.email)
      setEmailSent(true)
      setSubmittedEmail(data.email)
      toast({
        variant: 'success',
        title: t('auth.confirmationEmailSent', 'Email de confirmação enviado!'),
        description: t('auth.checkYourEmail', 'Verifique sua caixa de entrada e clique no link de confirmação.'),
      })
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || t('auth.errorSendingEmail', 'Erro ao enviar email')
      toast({
        variant: 'error',
        title: t('auth.error', 'Erro'),
        description: message,
      })
    }
  }

  function handleGoogleSignup() {
    const width = 500
    const height = 600
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2

    // Construct full URL for Google OAuth
    const googleAuthUrl = API_URL.startsWith('http')
      ? `${API_URL}/auth/google`
      : `${window.location.origin}${API_URL}/auth/google`

    const popup = window.open(
      googleAuthUrl,
      'google-signup',
      `width=${width},height=${height},left=${left},top=${top}`
    )

    if (!popup) return

    const listener = (event: MessageEvent) => {
      // segurança — só aceita do backend
      if (event.origin !== API_ORIGIN) return

      const { token, email, name } = event.data || {}
      if (!token) return

      // Get user ID from token payload
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const userId = payload.sub
        
        // Get role from token payload
        const role = payload.role || 'USER'
        
        // salva no auth context
        login(token, { sub: userId, email, name, role })
      } catch {
        // Fallback if token parsing fails
        login(token, { sub: 'google', email, name, role: 'USER' })
      }

      window.removeEventListener('message', listener)
      popup.close()
      location.href = '/app'
    }

    window.addEventListener('message', listener)
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-dark text-gray-100 p-6">
        <div className="w-full max-w-sm border border-gray-700 p-6 rounded-lg space-y-4">
          <h1 className="text-2xl font-bold text-primary text-center">{t('auth.signup')}</h1>
          
          <div className="space-y-4 text-center">
            <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
              <p className="text-green-400 font-semibold mb-2">
                {t('auth.confirmationEmailSent', 'Email de confirmação enviado!')}
              </p>
              <p className="text-sm text-gray-300">
                {t('auth.checkYourEmail', 'Verifique sua caixa de entrada e clique no link de confirmação.')}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {t('auth.emailSentTo', 'Email enviado para:')} {submittedEmail}
              </p>
            </div>
            
            <button
              onClick={() => {
                setEmailSent(false)
                setSubmittedEmail('')
              }}
              className="w-full bg-gray-700 text-white p-2 rounded font-semibold hover:bg-gray-600 transition text-center"
            >
              {t('auth.sendAnotherEmail', 'Enviar outro email')}
            </button>
          </div>

          <p className="text-sm text-gray-400 text-center">
            {t('auth.alreadyHaveAccount')}{' '}
            <a href="/login" className="text-primary hover:underline">
              {t('auth.loginHere')}
            </a>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-dark text-gray-100 p-6">
      <div className="w-full max-w-sm border border-gray-700 p-6 rounded-lg space-y-4">
        <h1 className="text-2xl font-bold text-primary text-center">{t('auth.signup')}</h1>

        <div className="p-3 bg-blue-900/20 border border-blue-700 rounded-lg mb-4">
          <p className="text-sm text-blue-300">
            {t('auth.youWillReceiveLink', 'Você receberá um email com um link para confirmar seu cadastro e definir sua senha.')}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <input
            className="w-full border p-2 rounded bg-dark border-gray-700 text-base"
            placeholder={t('auth.email')}
            {...register('email')}
          />
          {formState.errors.email && (
            <p className="text-sm text-red-500">{formState.errors.email.message}</p>
          )}

          <button
            disabled={formState.isSubmitting}
            className="w-full bg-primary text-black p-2 rounded font-semibold hover:bg-green-400 transition text-center"
          >
            {formState.isSubmitting ? '...' : t('auth.sendConfirmationLink', 'Enviar link de confirmação')}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 pt-2">
          <div className="flex-1 h-px bg-gray-700" />
          <span className="text-gray-500 text-xs">{t('common.or')}</span>
          <div className="flex-1 h-px bg-gray-700" />
        </div>

        {/* Google Signup Button */}
        <button
          onClick={handleGoogleSignup}
          className="w-full bg-red-500 text-white p-2 rounded font-semibold hover:bg-red-600 transition text-center"
        >
          {t('auth.signupWithGoogle')}
        </button>

        <p className="text-sm text-gray-400 text-center">
          {t('auth.alreadyHaveAccount')}{' '}
          <a href="/login" className="text-primary hover:underline">
            {t('auth.loginHere')}
          </a>
        </p>

        <p className="text-xs text-gray-600 text-center">
          {t('auth.backToHome')}{' '}
          <a href="/" className="hover:text-primary">
            {t('common.home')}
          </a>
        </p>
      </div>
    </div>
  )
}
