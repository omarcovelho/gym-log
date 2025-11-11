import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'

export default function Navbar() {
    console.log('Navbar mounted')
  const { logout } = useAuth()
  const location = useLocation()

  const links = [
    { to: '/app', label: 'Home' },
    { to: '/app/exercises/new', label: 'New Exercise' },
  ]

  return (
    <nav className="bg-dark text-gray-100 p-3 flex justify-between items-center border-b border-gray-700">
      <div className="flex items-center space-x-4">
        <span className="font-bold text-primary text-lg">GymLog</span>
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={`${
              location.pathname === l.to
                ? 'text-primary'
                : 'text-gray-400 hover:text-primary'
            } transition-colors`}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <button
        onClick={logout}
        className="text-sm border border-gray-600 px-3 py-1 rounded hover:bg-gray-800"
      >
        Logout
      </button>
    </nav>
  )
}
