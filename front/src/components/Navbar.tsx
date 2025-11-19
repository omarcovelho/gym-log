import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/AuthContext'
import { LogOut, User } from 'lucide-react'

export default function Navbar() {
  const { t } = useTranslation()
  const { logout } = useAuth()
  const location = useLocation()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f0f0f]/95 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-5xl mx-auto flex justify-between items-center px-4 py-3">
        {/* Logo */}
        <Link
          to="/app"
          className="font-extrabold text-xl text-primary tracking-tight hover:brightness-110 transition"
        >
          GymLog
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* User Stats button */}
          <Link
            to="/app/stats"
            className={`p-2 rounded-lg transition ${
              location.pathname === '/app/stats'
                ? 'text-primary bg-primary/10'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
            aria-label={t('navigation.myData')}
            title={t('navigation.myData')}
          >
            <User className="w-5 h-5" />
          </Link>

          {/* Logout button */}
          <button
            onClick={logout}
            className="text-gray-400 hover:text-gray-200 transition p-2 rounded-lg hover:bg-gray-800"
            aria-label={t('navigation.logout')}
            title={t('navigation.logout')}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  )
}
