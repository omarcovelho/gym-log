import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, Dumbbell, FileText } from 'lucide-react'

export function NavbarMenu() {
  const { t } = useTranslation()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const menuItems = [
    { path: '/app/exercises', icon: Dumbbell, label: t('navigation.exercises') },
    { path: '/app/templates', icon: FileText, label: t('navigation.templates') },
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
        <div className="absolute right-0 top-full mt-2 w-48 bg-[#181818] border border-gray-800 rounded-lg shadow-xl z-50">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-800 transition first:rounded-t-lg last:rounded-b-lg ${
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
        </div>
      )}
    </div>
  )
}

