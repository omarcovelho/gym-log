import { useAuth } from '@/auth/AuthContext'

export default function Home() {
  const { user } = useAuth()
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Welcome back, {user?.email}</h1>
      <p className="text-gray-400">
        Track your workouts, monitor progress, and crush your next goal.
      </p>
    </div>
  )
}
