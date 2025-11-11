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

  if (loading)
    return <p className="text-center mt-12 text-gray-400">Loading templates...</p>

  if (error)
    return <p className="text-center text-red-500 mt-12">{error}</p>

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">My Workout Templates</h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage your saved workout splits and customize your training days.
          </p>
        </div>

        <Link
          to="/app/templates/new"
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
          + New Template
        </Link>
      </div>

      {/* Empty state */}
      {templates.length === 0 && (
        <p className="text-gray-400 text-center mt-12">
          No templates created yet. Start by adding one above.
        </p>
      )}

      {/* Template cards */}
      <div className="space-y-5">
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
            {/* Header row */}
            <div className="flex justify-between items-start">
              <div>
                <h2 className="font-semibold text-lg text-gray-100">
                  {tpl.title}
                </h2>
                {tpl.notes && (
                  <p className="text-xs text-gray-500 italic mt-0.5">
                    {tpl.notes}
                  </p>
                )}
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
              <div className="mt-4 border-t border-gray-800 pt-3 space-y-3">
                {tpl.items.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No exercises.</p>
                ) : (
                  tpl.items.map((it) => (
                    <div
                      key={it.id}
                      className="bg-[#141414] rounded-lg p-3 border border-gray-800"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium text-gray-100">
                            {it.exercise.name}
                          </span>
                          {it.notes && (
                            <span className="text-gray-400 ml-1 italic text-xs">
                              – {it.notes}
                            </span>
                          )}
                        </div>
                        {it.exercise.muscleGroup && (
                          <span className="text-xs text-gray-500 uppercase">
                            {it.exercise.muscleGroup}
                          </span>
                        )}
                      </div>

                      {/* Sets */}
                      {it.sets && it.sets.length > 0 && (
                        <ul className="text-xs text-gray-400 mt-2 space-y-1">
                          {it.sets.map((s) => (
                            <li
                              key={s.id}
                              className="flex justify-between border-b border-gray-800 pb-1"
                            >
                              <div>
                                <span className="text-gray-300">
                                  Set {s.setIndex + 1}
                                </span>
                                {s.reps != null && (
                                  <span className="ml-1">– {s.reps} reps</span>
                                )}
                                {s.rir != null && (
                                  <span className="ml-1 text-gray-500">
                                    · RIR {s.rir}
                                  </span>
                                )}
                                {s.notes && (
                                  <span className="ml-1 text-gray-500 italic">
                                    · {s.notes}
                                  </span>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))
                )}
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
