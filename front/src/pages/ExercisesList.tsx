import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuth } from '@/auth/AuthContext'
import { useToast } from '@/components/ToastProvider'
import { ConfirmDialog } from '@/components/ConfirmDialog'

export type Exercise = {
  id: string
  name: string
  muscleGroup: string | null
  notes?: string | null
}

export default function ExercisesList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) navigate('/login')
    else loadExercises()
  }, [user, navigate])

  async function loadExercises() {
    try {
      setLoading(true)
      const { data } = await api.get<Exercise[]>('/exercises')
      setExercises(data)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load exercises')
      toast({
        variant: 'error',
        title: 'Error loading exercises',
        description: e?.message ?? 'Try again later.',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    setDeletingId(id)
    try {
      await api.delete(`/exercises/${id}`)
      toast({
        variant: 'success',
        title: 'Exercise deleted',
        description: `"${name}" was removed successfully.`,
      })
      await loadExercises()
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
    return <p className="text-center mt-12 text-gray-400">Loading exercises...</p>

  if (error)
    return <p className="text-center text-red-500 mt-12">{error}</p>

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">My Exercises</h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage your custom exercises to use in workout templates.
          </p>
        </div>

        <Link
          to="/app/exercises/new"
          className="
            w-full sm:w-auto
            px-4 py-2
            bg-primary
            text-black
            rounded-lg
            font-semibold
            text-sm
            shadow-md
            hover:brightness-110
            transition
            text-center
          "
        >
          + New Exercise
        </Link>
      </div>

      {/* Empty state */}
      {exercises.length === 0 && (
        <p className="text-gray-400 text-center mt-12">
          No exercises created yet. Start by adding one above.
        </p>
      )}

      {/* Exercise cards */}
      <div className="space-y-5">
        {exercises.map((ex) => (
          <div
            key={ex.id}
            className="
              bg-[#181818]
              rounded-xl
              p-5
              border border-gray-800
              shadow-sm
              transition-all
              duration-200
              ease-in-out
              hover:shadow-lg
              hover:-translate-y-0.5
              hover:border-gray-700
            "
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="font-semibold text-lg text-gray-100">{ex.name}</h2>
                {ex.muscleGroup && (
                  <p className="text-xs text-gray-500 uppercase mt-0.5">
                    {ex.muscleGroup}
                  </p>
                )}
                {ex.notes && (
                  <p className="text-xs text-gray-500 italic mt-1">{ex.notes}</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/app/exercises/${ex.id}/edit`)}
                  className="text-xs px-3 py-1.5 rounded-md font-medium bg-[#101010] text-gray-400 hover:text-gray-200 transition"
                >
                  Edit
                </button>

                <button
                  disabled={deletingId === ex.id}
                  onClick={() => setConfirmId(ex.id)}
                  className={`
                    text-xs px-3 py-1.5 rounded-md font-medium transition
                    ${
                      deletingId === ex.id
                        ? 'opacity-50 cursor-not-allowed'
                        : 'bg-red-900/40 text-red-400 hover:bg-red-900 hover:text-red-200'
                    }
                  `}
                >
                  {deletingId === ex.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>

            {/* Confirm deletion */}
            <ConfirmDialog
              open={confirmId === ex.id}
              title="Delete exercise"
              message={`Are you sure you want to delete "${ex.name}"? This action cannot be undone.`}
              confirmText="Delete"
              cancelText="Cancel"
              onConfirm={() => handleDelete(ex.id, ex.name)}
              onCancel={() => setConfirmId(null)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
