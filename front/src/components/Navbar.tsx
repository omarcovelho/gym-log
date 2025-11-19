import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { LogOut } from 'lucide-react'

export default function Navbar() {
  const { logout } = useAuth()

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

        {/* Logout button */}
        <button
          onClick={logout}
          className="text-gray-400 hover:text-gray-200 transition p-2 rounded-lg hover:bg-gray-800"
          aria-label="Logout"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </nav>
  )
}
