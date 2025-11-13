import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuth } from '@/auth/AuthContext'
import { useToast } from '@/components/ToastProvider'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { startManualWorkout } from '@/api/workoutSession'

type WorkoutSession = {
  id: string
  title: string | null
  startAt: string
  endAt: string | null
}

export default function WorkoutLogsList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)

  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [startFreeOpen, setStartFreeOpen] = useState(false)
  const [startingFree, setStartingFree] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    load()
  }, [user, navigate])

  async function load() {
    try {
      setLoading(true)
      const { data } = await api.get<WorkoutSession[]>('/workouts')
      setSessions(data)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await api.delete(`/workouts/${id}`)
      toast({
        variant: 'success',
        title: 'Workout deleted',
      })
      await load()
    } finally {
      setDeletingId(null)
      setConfirmId(null)
    }
  }

  async function handleStartFreeWorkout() {
    setStartingFree(true)
    try {
      const session = await startManualWorkout()
      toast({
        variant: 'success',
        title: 'Free workout started',
      })
      navigate(`/app/workouts/${session.id}`)
    } finally {
      setStartingFree(false)
      setStartFreeOpen(false)
    }
  }

  if (loading)
    return <p className="text-gray-400 text-center mt-8">Loading sessions...</p>

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Workout History</h1>
          <p className="text-sm text-gray-400">
            Track your completed and ongoing workouts.
          </p>
        </div>

        <button
          onClick={() => setStartFreeOpen(true)}
          className="px-4 py-2 bg-blue-900/40 text-blue-300 rounded-lg font-semibold text-sm hover:bg-blue-900 hover:text-blue-100 transition"
        >
          Start Free Workout
        </button>
      </header>

      <div className="space-y-5">
        {sessions.map((s) => (
          <div
            key={s.id}
            className="p-4 bg-[#181818] rounded-lg border border-gray-800 hover:border-gray-600 transition"
          >
            <div className="flex justify-between items-start gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-100">
                  {s.title ?? 'Free Workout'}
                </h2>

                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(s.startAt).toLocaleString()}
                </p>

                {s.endAt ? (
                  <span className="text-xs mt-2 inline-block px-2 py-1 rounded bg-green-900/40 text-green-400">
                    Finished
                  </span>
                ) : (
                  <span className="text-xs mt-2 inline-block px-2 py-1 rounded bg-yellow-900/40 text-yellow-400">
                    In progress
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() =>
                    navigate(
                      s.endAt
                        ? `/app/workouts/${s.id}/view`
                        : `/app/workouts/${s.id}`
                    )
                  }
                  className="text-xs px-3 py-1.5 rounded-md bg-[#101010] text-gray-400 hover:text-gray-200 transition"
                >
                  View
                </button>

                <button
                  onClick={() => setConfirmId(s.id)}
                  disabled={deletingId === s.id}
                  className={`
                    text-xs px-3 py-1.5 rounded-md
                    ${
                      deletingId === s.id
                        ? 'opacity-50 bg-red-900/20 text-red-700'
                        : 'bg-red-900/40 text-red-400 hover:bg-red-900 hover:text-red-200'
                    }
                  `}
                >
                  {deletingId === s.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>

            <ConfirmDialog
              open={confirmId === s.id}
              title="Delete workout"
              message="Delete this workout session?"
              confirmText="Delete"
              cancelText="Cancel"
              onConfirm={() => handleDelete(s.id)}
              onCancel={() => setConfirmId(null)}
            />
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={startFreeOpen}
        title="Start Free Workout"
        message="Start a workout without a template?"
        confirmText="Start"
        cancelText="Cancel"
        onConfirm={handleStartFreeWorkout}
        onCancel={() => setStartFreeOpen(false)}
      />
    </div>
  )
}
