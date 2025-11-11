import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  listWorkoutTemplates,
  deleteWorkoutTemplate,
  type WorkoutTemplate,
} from '@/api/workoutTemplates'
import { useAuth } from '@/auth/AuthContext'
import { useToast } from '@/components/ToastProvider'
import { ConfirmDialog } from '@/components/ConfirmDialog'

export default function WorkoutTemplatesList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    loadTemplates()
  }, [user, navigate])

  async function loadTemplates() {
    try {
      setLoading(true)
      const data = await listWorkoutTemplates()
      setTemplates(data)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load templates')
      toast({
        variant: 'error',
        title: 'Error loading templates',
        description: e?.message ?? 'Try again later.',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, title: string) {
    setDeletingId(id)
    try {
      await deleteWorkoutTemplate(id)
      toast({
        variant: 'success',
        title: 'Template deleted',
        description: `"${title}" was removed successfully.`,
      })
      await loadTemplates()
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

  if (loading) return <p className="text-center mt-10">Loading templates...</p>
  if (error)
    return <p className="text-center text-red-500 mt-10">{error}</p>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Workout Templates</h1>
        <Link
            to="/app/templates/new"
            className="
                px-3 py-1.5
                bg-primary
                text-black
                rounded-md
                font-medium
                text-sm
                shadow-sm
                hover:brightness-110
                transition
            "
            >
            + New Template
            </Link>
      </div>

      {templates.length === 0 && (
        <p className="text-gray-400 text-center mt-10">
          No templates created yet.
        </p>
      )}

      {/* Template cards */}
      <div className="space-y-4">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
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
                <h2 className="font-semibold text-lg text-gray-100">
                  {tpl.title}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {tpl.items.length} {tpl.items.length === 1 ? 'exercise' : 'exercises'}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setExpandedId(expandedId === tpl.id ? null : tpl.id)
                  }
                  className={`
                    text-xs px-3 py-1.5 rounded-md font-medium transition
                    ${
                      expandedId === tpl.id
                        ? 'bg-gray-700 text-gray-100'
                        : 'bg-[#101010] text-gray-400 hover:text-gray-200'
                    }
                  `}
                >
                  {expandedId === tpl.id ? 'Hide' : 'View'}
                </button>

                <button
                  disabled={deletingId === tpl.id}
                  onClick={() => setConfirmId(tpl.id)}
                  className={`
                    text-xs px-3 py-1.5 rounded-md font-medium transition
                    ${
                      deletingId === tpl.id
                        ? 'opacity-50 cursor-not-allowed'
                        : 'bg-red-900/40 text-red-400 hover:bg-red-900 hover:text-red-200'
                    }
                  `}
                >
                  {deletingId === tpl.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>

            {/* Expanded section */}
            {expandedId === tpl.id && (
              <div className="mt-4 border-t border-gray-800 pt-3 space-y-2">
                <h3 className="text-sm font-semibold text-gray-300">
                  Exercises
                </h3>
                <ul className="divide-y divide-gray-800">
                  {tpl.items.map((it) => (
                    <li
                      key={it.id}
                      className="flex justify-between items-center py-2"
                    >
                      <div>
                        <span className="font-medium text-gray-100">
                          {it.exercise.name}
                        </span>
                        {it.target && (
                          <span className="text-gray-400 ml-1">
                            – {it.target}
                          </span>
                        )}
                      </div>
                      {it.exercise.muscleGroup && (
                        <span className="text-xs text-gray-500 uppercase">
                          {it.exercise.muscleGroup}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Delete confirmation modal */}
            <ConfirmDialog
              open={confirmId === tpl.id}
              title="Delete template"
              message={`Are you sure you want to delete "${tpl.title}"? This action cannot be undone.`}
              confirmText="Delete"
              cancelText="Cancel"
              onConfirm={() => handleDelete(tpl.id, tpl.title)}
              onCancel={() => setConfirmId(null)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
