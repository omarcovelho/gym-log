import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Welcome() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-dark text-gray-100 p-6">
      <h1 className="text-4xl font-bold text-primary mb-4">{t('welcome.title')}</h1>
      <p className="text-gray-400 mb-10 text-center max-w-md">
        {t('welcome.description')}
      </p>

      <div className="flex space-x-4">
        <Link
          to="/login"
          className="px-6 py-2 rounded bg-primary text-black font-semibold hover:bg-green-400 transition"
        >
          {t('welcome.login')}
        </Link>
        <Link
          to="/signup"
          className="px-6 py-2 rounded border border-primary text-primary hover:bg-primary hover:text-black transition"
        >
          {t('welcome.signUp')}
        </Link>
      </div>
    </div>
  )
}
