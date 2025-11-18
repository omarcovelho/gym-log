import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  listWorkoutTemplates,
  deleteWorkoutTemplate,
  type WorkoutTemplate,
} from '@/api/workoutTemplates'
import { useAuth } from '@/auth/AuthContext'
import { useToast } from '@/components/ToastProvider'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Pagination, type PaginationMeta } from '@/components/Pagination'

export default function WorkoutTemplatesList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const currentPage = parseInt(searchParams.get('page') || '1', 10)
  const currentLimit = parseInt(searchParams.get('limit') || '10', 10)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    load(currentPage, currentLimit)
  }, [user, navigate, currentPage, currentLimit])

  async function load(page: number = 1, limit: number = 10) {
    try {
      setLoading(true)
      const result = await listWorkoutTemplates(page, limit)
      setTemplates(result.data)
      setPagination(result.meta)
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

  function handlePageChange(page: number) {
    setSearchParams({ page: page.toString(), limit: currentLimit.toString() })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(id: string, title: string) {
    setDeletingId(id)
    try {
      await deleteWorkoutTemplate(id)
      toast({
        variant: 'success',
        title: 'Template deleted',
        description: `"${title}" was removed.`,
      })
      await load(currentPage, currentLimit)
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

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">My Workout Templates</h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage your workout templates and splits.
          </p>
        </div>

        <Link
          to="/app/templates/new"
          className="px-4 py-2 bg-primary text-black rounded-lg font-semibold text-sm hover:brightness-110 transition"
        >
          + New Template
        </Link>
      </div>

      {/* EMPTY STATE */}
      {templates.length === 0 && (
        <p className="text-gray-400 text-center mt-12">No templates created yet.</p>
      )}

      {/* TEMPLATE LIST */}
      <div className="space-y-5">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className="bg-[#181818] rounded-xl p-5 border border-gray-800 hover:border-gray-600 transition"
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="font-semibold text-lg text-gray-100">{tpl.title}</h2>
                {tpl.notes && (
                  <p className="text-xs text-gray-500 italic mt-0.5">{tpl.notes}</p>
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
                  className="text-xs px-3 py-1.5 rounded-md bg-[#101010] text-gray-400 hover:text-gray-200"
                >
                  {expandedId === tpl.id ? 'Hide' : 'View'}
                </button>

                <Link
                  to={`/app/templates/${tpl.id}/edit`}
                  className="text-xs px-3 py-1.5 rounded-md bg-blue-900/40 text-blue-400 hover:bg-blue-900 hover:text-blue-200"
                >
                  Edit
                </Link>

                <button
                  onClick={() => setConfirmId(tpl.id)}
                  disabled={deletingId === tpl.id}
                  className={`
                    text-xs px-3 py-1.5 rounded-md
                    ${
                      deletingId === tpl.id
                        ? 'opacity-50 bg-red-900/20 text-red-700'
                        : 'bg-red-900/40 text-red-400 hover:bg-red-900 hover:text-red-200'
                    }
                  `}
                >
                  {deletingId === tpl.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>

            {/* EXPANDED ITEMS */}
            {expandedId === tpl.id && (
              <div className="mt-4 border-t border-gray-800 pt-3 space-y-3">
                {tpl.items.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No exercises.</p>
                ) : (
                  tpl.items.map((it) => (
                    <div key={it.id} className="bg-[#141414] rounded-lg p-3 border border-gray-800">
                      <div className="flex justify-between">
                        <span className="text-gray-100 font-medium">{it.exercise.name}</span>
                        {it.exercise.muscleGroup && (
                          <span className="text-xs text-gray-500 uppercase">
                            {it.exercise.muscleGroup}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            <ConfirmDialog
              open={confirmId === tpl.id}
              title="Delete template"
              message={`Delete "${tpl.title}"?`}
              confirmText="Delete"
              cancelText="Cancel"
              onConfirm={() => handleDelete(tpl.id, tpl.title)}
              onCancel={() => setConfirmId(null)}
            />
          </div>
        ))}
      </div>

      {/* Pagination */}
      {!loading && templates.length > 0 && (
        <Pagination meta={pagination} onPageChange={handlePageChange} />
      )}
    </div>
  )
}
