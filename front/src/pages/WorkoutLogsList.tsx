import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuth } from '@/auth/AuthContext'
import { useToast } from '@/components/ToastProvider'
import { ConfirmDialog } from '@/components/ConfirmDialog'

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

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    loadSessions()
  }, [user, navigate])

  async function loadSessions() {
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
        description: 'The session was removed successfully.',
      })
      await loadSessions()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Delete failed',
        description: e?.message ?? 'Something went wrong.',
      })
    } finally {
      setDeletingId(null)
      setConfirmId(null)
    }
  }

  if (loading)
    return <p className="text-gray-400 text-center mt-8">Loading sessions...</p>

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Workout History</h1>
          <p className="text-gray-400 text-sm">
            Track all your completed and ongoing sessions.
          </p>
        </div>
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
                  {s.title ?? 'Custom Workout'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(s.startAt).toLocaleString()}
                </p>

                {s.endAt ? (
                  <span className="text-xs bg-green-900/40 text-green-400 px-2 py-1 rounded mt-2 inline-block">
                    Finished
                  </span>
                ) : (
                  <span className="text-xs bg-yellow-900/40 text-yellow-400 px-2 py-1 rounded mt-2 inline-block">
                    In progress
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {/* VIEW BUTTON */}
                <button
                  onClick={() =>
                    s.endAt
                      ? navigate(`/app/workouts/${s.id}/view`)
                      : navigate(`/app/workouts/${s.id}`)
                  }
                  className="text-xs px-3 py-1.5 rounded-md font-medium transition bg-[#101010] text-gray-400 hover:text-gray-200"
                >
                  View
                </button>

                {/* DELETE BUTTON */}
                <button
                  onClick={() => setConfirmId(s.id)}
                  disabled={deletingId === s.id}
                  className={`
                    text-xs px-3 py-1.5 rounded-md font-medium transition
                    ${
                      deletingId === s.id
                        ? 'opacity-50 cursor-not-allowed'
                        : 'bg-red-900/40 text-red-400 hover:bg-red-900 hover:text-red-200'
                    }
                  `}
                >
                  {deletingId === s.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>

            {/* CONFIRM DIALOG */}
            <ConfirmDialog
              open={confirmId === s.id}
              title="Delete workout"
              message={`Are you sure you want to delete this workout session? This action cannot be undone.`}
              confirmText="Delete"
              cancelText="Cancel"
              onConfirm={() => handleDelete(s.id)}
              onCancel={() => setConfirmId(null)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
