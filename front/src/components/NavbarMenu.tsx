import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/AuthContext'
import { Menu, Dumbbell, FileText, Info, LogOut } from 'lucide-react'

export function NavbarMenu() {
  const { t } = useTranslation()
  const { logout } = useAuth()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const menuItems = [
    { path: '/app/exercises', icon: Dumbbell, label: t('navigation.exercises'), type: 'link' },
    { path: '/app/templates', icon: FileText, label: t('navigation.templates'), type: 'link' },
  ]

  const actionItems: Array<{
    path?: string
    icon: typeof Info | typeof LogOut
    label: string
    type: 'link' | 'button'
    action?: () => void
  }> = [
    { path: '/app/about', icon: Info, label: t('about.title'), type: 'link' },
    { icon: LogOut, label: t('navigation.logout'), type: 'button', action: logout },
  ]

  const isActive = (path: string) => {
    if (path === '/app') {
      return location.pathname === '/app' || location.pathname === '/app/'
    }
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg transition ${
          isOpen
            ? 'text-primary bg-primary/10'
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
        }`}
        aria-label={t('navigation.menu')}
        title={t('navigation.menu')}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-[#181818] border border-gray-800 rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Navigation Items */}
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-800 transition ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}

          {/* Separator */}
          <div className="border-t border-gray-800 my-1" />

          {/* Action Items */}
          {actionItems.map((item, index) => {
            const Icon = item.icon
            const active = item.path ? isActive(item.path) : false
            const isLast = index === actionItems.length - 1

            if (item.type === 'button') {
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    setIsOpen(false)
                    item.action?.()
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-800 transition text-gray-300 text-left"
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              )
            }

            return item.path ? (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-800 transition ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-300'
                } ${isLast ? 'rounded-b-lg' : ''}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ) : null
          })}
        </div>
      )}
    </div>
  )
}

