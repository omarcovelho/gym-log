import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  // Show loading state while validating token
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="text-gray-400 text-sm">Loading...</div>
        </div>
      </div>
    )
  }

  // If user is authenticated, redirect to dashboard
  if (user) {
    return <Navigate to="/app" replace />
  }

  return children
}

