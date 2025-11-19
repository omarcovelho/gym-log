import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, Pencil, Trash2 } from 'lucide-react'
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
  const { t } = useTranslation()
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
      setError(e?.message ?? t('templates.errorLoading'))
      toast({
        variant: 'error',
        title: t('templates.errorLoading'),
        description: e?.message ?? t('templates.errorLoadingDescription'),
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
        title: t('templates.templateDeleted'),
        description: t('templates.templateDeletedDescription', { title }),
      })
      await load(currentPage, currentLimit)
    } finally {
      setDeletingId(null)
      setConfirmId(null)
    }
  }

  if (loading)
    return <p className="text-center mt-12 text-gray-400">{t('common.loadingTemplates')}</p>

  if (error)
    return <p className="text-center text-red-500 mt-12">{error}</p>

  return (
    <div className="max-w-3xl mx-auto space-y-8">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">{t('templates.myTemplates')}</h1>
          <p className="text-sm text-gray-400 mt-1">
            {t('templates.myTemplatesDescription')}
          </p>
        </div>

        <Link
          to="/app/templates/new"
          className="px-4 py-2 bg-primary text-black rounded-lg font-semibold text-sm hover:brightness-110 transition"
        >
          {t('templates.newTemplate')}
        </Link>
      </div>

      {/* EMPTY STATE */}
      {templates.length === 0 && (
        <p className="text-gray-400 text-center mt-12">{t('templates.noTemplates')}</p>
      )}

      {/* TEMPLATE LIST */}
      <div className="space-y-5">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className="bg-[#181818] rounded-xl p-5 border border-gray-800 shadow-sm transition-all duration-200 ease-in-out hover:shadow-lg hover:-translate-y-0.5 hover:border-gray-700"
          >
            <div className="flex justify-between items-start gap-4">
              <div>
                <h2 className="font-semibold text-lg text-gray-100">{tpl.title}</h2>
                {tpl.notes && (
                  <p className="text-xs text-gray-500 italic mt-0.5">{tpl.notes}</p>
                )}

                <p className="text-xs text-gray-500 mt-0.5">
                  {tpl.items.length} {tpl.items.length === 1 ? t('workout.exercisesCount') : t('workout.exercisesCountPlural')}
                </p>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() =>
                    setExpandedId(expandedId === tpl.id ? null : tpl.id)
                  }
                  className="p-2 rounded-md bg-[#101010] text-gray-400 hover:text-gray-200 border border-gray-800 transition"
                  aria-label={expandedId === tpl.id ? t('templates.hideExercises') : t('templates.viewExercises')}
                  title={expandedId === tpl.id ? t('templates.hide') : t('templates.view')}
                >
                  {expandedId === tpl.id ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>

                <Link
                  to={`/app/templates/${tpl.id}/edit`}
                  className="p-2 rounded-md bg-[#101010] text-gray-400 hover:text-gray-200 border border-gray-800 transition flex items-center justify-center"
                  aria-label="Edit template"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </Link>

                <button
                  onClick={() => setConfirmId(tpl.id)}
                  disabled={deletingId === tpl.id}
                  className={`
                    p-2 rounded-md border transition
                    ${
                      deletingId === tpl.id
                        ? 'opacity-50 cursor-not-allowed bg-[#101010] text-gray-500 border-gray-800'
                        : 'bg-[#101010] text-gray-400 hover:text-gray-200 border-gray-800'
                    }
                  `}
                  aria-label="Delete template"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* EXPANDED ITEMS */}
            {expandedId === tpl.id && (
              <div className="mt-4 border-t border-gray-800 pt-3 space-y-3">
                {tpl.items.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">{t('templates.noExercises')}</p>
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
              title={t('dialog.deleteTemplate')}
              message={t('dialog.deleteTemplateMessage', { title: tpl.title })}
              confirmText={t('common.delete')}
              cancelText={t('common.cancel')}
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
