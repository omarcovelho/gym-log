import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/auth/AuthContext'
import { useToast } from '@/components/ToastProvider'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Pagination, type PaginationMeta } from '@/components/Pagination'

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
  const [searchParams, setSearchParams] = useSearchParams()

  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

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
      const { data } = await api.get<{ data: WorkoutSession[]; meta: PaginationMeta }>('/workouts', {
        params: { page, limit },
      })
      setSessions(data.data)
      setPagination(data.meta)
    } finally {
      setLoading(false)
    }
  }

  function handlePageChange(page: number) {
    setSearchParams({ page: page.toString(), limit: currentLimit.toString() })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await api.delete(`/workouts/${id}`)
      toast({
        variant: 'success',
        title: 'Workout deleted',
      })
      await load(currentPage, currentLimit)
    } finally {
      setDeletingId(null)
      setConfirmId(null)
    }
  }

  if (loading)
    return <p className="text-gray-400 text-center mt-8">Loading sessions...</p>

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-100">Workout History</h1>
        <p className="text-sm text-gray-400 mt-1">
          Track your completed and ongoing workouts.
        </p>
      </header>

      <div className="space-y-5">
        {sessions.map((s) => (
          <div
            key={s.id}
            className="bg-[#181818] rounded-xl p-5 border border-gray-800 shadow-sm transition-all duration-200 ease-in-out hover:shadow-lg hover:-translate-y-0.5 hover:border-gray-700"
          >
            <div className="flex justify-between items-start gap-4">
              <div>
                <h2 className="font-semibold text-lg text-gray-100">
                  {s.title ?? 'Free Workout'}
                </h2>

                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(s.startAt).toLocaleString()}
                </p>

                {s.endAt ? (
                  <span className="inline-flex items-center gap-1 text-xs mt-2 px-2 py-1 rounded-md bg-green-900/20 text-green-400 border border-green-800/30 font-medium">
                    Finished
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs mt-2 px-2 py-1 rounded-md bg-yellow-900/20 text-yellow-400 border border-yellow-800/30 font-medium">
                    In progress
                  </span>
                )}
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() =>
                    navigate(
                      s.endAt
                        ? `/app/workouts/${s.id}/view`
                        : `/app/workouts/${s.id}`
                    )
                  }
                  className="p-2 rounded-md bg-[#101010] text-gray-400 hover:text-gray-200 border border-gray-800 transition"
                  aria-label="View workout"
                  title="View"
                >
                  <Eye className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setConfirmId(s.id)}
                  disabled={deletingId === s.id}
                  className={`
                    p-2 rounded-md border transition
                    ${
                      deletingId === s.id
                        ? 'opacity-50 cursor-not-allowed bg-[#101010] text-gray-500 border-gray-800'
                        : 'bg-[#101010] text-gray-400 hover:text-gray-200 border-gray-800'
                    }
                  `}
                  aria-label="Delete workout"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
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

      {/* Pagination */}
      {!loading && sessions.length > 0 && (
        <Pagination meta={pagination} onPageChange={handlePageChange} />
      )}
    </div>
  )
}
