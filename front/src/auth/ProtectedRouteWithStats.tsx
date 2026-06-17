import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from './AuthContext'
import { getUserStats } from '@/api/user'
import { hasCompletedProfile } from '@/utils/profile'

export default function ProtectedRouteWithStats({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const location = useLocation()

  // Check if user has stats filled - must be called before any conditional returns
  const { data: stats, isLoading: statsLoading, isError: statsError, refetch } = useQuery({
    queryKey: ['user-stats'],
    queryFn: getUserStats,
    enabled: !!user && !authLoading,
    staleTime: 0, // Always consider data stale to ensure fresh data
    refetchOnMount: true, // Always refetch when component mounts
  })

  // First check authentication - use ProtectedRoute for auth check
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="text-gray-400 text-sm">Validating session...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  // Show loading while checking stats
  if (statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="text-gray-400 text-sm">Carregando...</div>
        </div>
      </div>
    )
  }

  if (statsError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark px-4">
        <div className="text-center space-y-4">
          <p className="text-gray-400 text-sm">Could not load your profile data.</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary text-dark font-semibold rounded-lg hover:brightness-110 transition"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  const hasStats = hasCompletedProfile(stats)

  // If on stats page, allow access
  if (location.pathname === '/app/stats') {
    return <>{children}</>
  }

  // If stats not filled, redirect to stats page
  if (!hasStats) {
    return <Navigate to="/app/stats" replace />
  }

  // Stats are filled, allow access
  return <>{children}</>
}

