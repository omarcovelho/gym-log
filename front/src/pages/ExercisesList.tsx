import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth, type User } from '@/auth/AuthContext'
import { useToast } from '@/components/ToastProvider'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Pagination, type PaginationMeta } from '@/components/Pagination'

export type Exercise = {
  id: string
  name: string
  muscleGroup: string | null
  notes?: string | null
  isGlobal?: boolean
  createdById?: string
}

export default function ExercisesList() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  function canEdit(exercise: Exercise, user: User): boolean {
    if (!user) return false
    if (exercise.isGlobal === true) {
      return user.role === 'ADMIN'
    }
    return exercise.createdById === user.sub || user.role === 'ADMIN'
  }

  function canDelete(exercise: Exercise, user: User): boolean {
    if (!user) return false
    if (exercise.isGlobal === true) {
      return user.role === 'ADMIN'
    }
    return exercise.createdById === user.sub || user.role === 'ADMIN'
  }

  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  const currentPage = parseInt(searchParams.get('page') || '1', 10)
  const currentLimit = parseInt(searchParams.get('limit') || '10', 10)

  useEffect(() => {
    if (!user) navigate('/login')
    else loadExercises(currentPage, currentLimit)
  }, [user, navigate, currentPage, currentLimit])

  async function loadExercises(page: number = 1, limit: number = 10) {
    try {
      setLoading(true)
      const { data } = await api.get<{ data: Exercise[]; meta: PaginationMeta }>('/exercises', {
        params: { page, limit },
      })
      setExercises(data.data)
      setPagination(data.meta)
    } catch (e: any) {
      setError(e?.message ?? t('exercise.errorLoading'))
      toast({
        variant: 'error',
        title: t('exercise.errorLoading'),
        description: e?.message ?? t('exercise.errorLoadingDescription'),
      })
    } finally {
      setLoading(false)
    }
  }

  function handlePageChange(page: number) {
    setSearchParams({ page: page.toString(), limit: currentLimit.toString() })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(id: string, name: string) {
    setDeletingId(id)
    try {
      await api.delete(`/exercises/${id}`)
      toast({
        variant: 'success',
        title: t('exercise.exerciseDeleted'),
        description: t('exercise.exerciseDeletedDescription', { name }),
      })
      await loadExercises(currentPage, currentLimit)
    } catch (e: any) {
      toast({
        variant: 'error',
        title: t('exercise.deleteFailed'),
        description: e?.message ?? t('exercise.deleteFailedDescription'),
      })
    } finally {
      setDeletingId(null)
      setConfirmId(null)
    }
  }

  if (loading)
    return <p className="text-center mt-12 text-gray-400">{t('common.loadingExercises')}</p>

  if (error)
    return <p className="text-center text-red-500 mt-12">{error}</p>

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">{t('exercise.myExercises')}</h1>
          <p className="text-sm text-gray-400 mt-1">
            {t('exercise.myExercisesDescription')}
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
          {t('exercise.newExerciseButton')}
        </Link>
      </div>

      {/* Empty state */}
      {exercises.length === 0 && (
        <p className="text-gray-400 text-center mt-12">
          {t('exercise.noExercises')}
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
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-lg text-gray-100">{ex.name}</h2>
                </div>
                {ex.muscleGroup && (
                  <p className="text-xs text-gray-500 uppercase mt-0.5">
                    {ex.muscleGroup}
                  </p>
                )}
                {ex.notes && (
                  <p className="text-xs text-gray-500 italic mt-1">{ex.notes}</p>
                )}
              </div>

              {user && (canEdit(ex, user) || canDelete(ex, user)) && (
                <div className="flex gap-2 flex-shrink-0">
                  {canEdit(ex, user) && (
                    <button
                      onClick={() => navigate(`/app/exercises/${ex.id}/edit`)}
                      className="p-2 rounded-md bg-[#101010] text-gray-400 hover:text-gray-200 border border-gray-800 transition"
                      aria-label="Edit exercise"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}

                  {canDelete(ex, user) && (
                    <button
                      disabled={deletingId === ex.id}
                      onClick={() => setConfirmId(ex.id)}
                      className={`
                        p-2 rounded-md transition border
                        ${
                          deletingId === ex.id
                            ? 'opacity-50 cursor-not-allowed bg-[#101010] text-gray-500 border-gray-800'
                            : 'bg-[#101010] text-gray-400 hover:text-gray-200 border-gray-800'
                        }
                      `}
                      aria-label="Delete exercise"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Confirm deletion */}
            <ConfirmDialog
              open={confirmId === ex.id}
              title={t('dialog.deleteExercise')}
              message={t('dialog.deleteExerciseMessage', { name: ex.name })}
              confirmText={t('common.delete')}
              cancelText={t('common.cancel')}
              onConfirm={() => handleDelete(ex.id, ex.name)}
              onCancel={() => setConfirmId(null)}
            />
          </div>
        ))}
      </div>

      {/* Pagination */}
      {!loading && exercises.length > 0 && (
        <Pagination meta={pagination} onPageChange={handlePageChange} />
      )}
    </div>
  )
}
