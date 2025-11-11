import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const { logout } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const links = [
    { to: '/app', label: 'Home' },
    { to: '/app/exercises/new', label: 'New Exercise' },
    { to: '/app/templates', label: 'Templates' },
  ]

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

        {/* Desktop links */}
        <div className="hidden md:flex items-center space-x-6">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`
                text-sm font-medium relative transition
                ${
                  location.pathname === l.to
                    ? 'text-primary after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[2px] after:bg-primary after:rounded-full'
                    : 'text-gray-400 hover:text-primary'
                }
              `}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={logout}
            className="ml-4 text-sm text-gray-300 border border-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-800 hover:text-white transition"
          >
            Logout
          </button>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="md:hidden text-gray-300 hover:text-primary transition"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-gray-800 bg-[#0f0f0f]/95 px-4 py-3 space-y-3 animate-fadeIn">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={`block text-sm ${
                location.pathname === l.to
                  ? 'text-primary font-semibold'
                  : 'text-gray-300 hover:text-primary'
              } transition`}
            >
              {l.label}
            </Link>
          ))}

          <button
            onClick={() => {
              setOpen(false)
              logout()
            }}
            className="block w-full text-left text-sm text-gray-300 border border-gray-700 px-3 py-2 rounded-md hover:bg-gray-800 hover:text-white transition"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  )
}
