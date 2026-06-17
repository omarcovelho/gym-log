import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { User } from 'lucide-react'
import { NavbarMenu } from './NavbarMenu'

const desktopNavItems = [
  { path: '/app', labelKey: 'navigation.home' },
  { path: '/app/workouts', labelKey: 'navigation.workouts' },
  { path: '/app/progress', labelKey: 'navigation.progress' },
  { path: '/app/measurements', labelKey: 'navigation.diary' },
] as const

export default function Navbar() {
  const { t } = useTranslation()
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/app') {
      return location.pathname === '/app' || location.pathname === '/app/'
    }
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f0f0f]/95 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-6xl xl:max-w-7xl mx-auto flex justify-between items-center gap-4 px-4 sm:px-6 lg:px-8 py-3">
        {/* Logo */}
        <Link
          to="/app"
          className="font-extrabold text-xl text-primary tracking-tight hover:brightness-110 transition shrink-0"
        >
          GymLog
        </Link>

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {desktopNavItems.map((item) => {
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  active
                    ? 'text-primary bg-primary/10'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/80'
                }`}
              >
                {t(item.labelKey)}
              </Link>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
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

          {/* Menu Dropdown */}
          <NavbarMenu />
        </div>
      </div>
    </nav>
  )
}
