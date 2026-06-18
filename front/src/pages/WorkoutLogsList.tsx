import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Eye, Trash2, Tag, Copy } from 'lucide-react'
import { listWorkoutSessions, updateWorkoutSession, copyWorkout, type WorkoutSession } from '@/api/workoutSession'
import { listTags } from '@/api/workoutTags'
import { useAuth } from '@/auth/AuthContext'
import { useToast } from '@/components/ToastProvider'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Pagination, type PaginationMeta } from '@/components/Pagination'
import {
  WorkoutTagPicker,
  fromSessionTags,
  toSessionTagsPayload,
  type WorkoutTagPickerValue,
} from '@/components/WorkoutTagPicker'
import { api } from '@/lib/api'

export default function WorkoutLogsList() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()
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
  const [copyConfirmId, setCopyConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copyingId, setCopyingId] = useState<string | null>(null)
  const [editingSession, setEditingSession] = useState<WorkoutSession | null>(null)
  const [editTags, setEditTags] = useState<WorkoutTagPickerValue>({ tagIds: [], newTagNames: [] })
  const [savingTags, setSavingTags] = useState(false)

  const currentPage = parseInt(searchParams.get('page') || '1', 10)
  const currentLimit = parseInt(searchParams.get('limit') || '10', 10)
  const filterTagIds = searchParams.get('tagIds')?.split(',').filter(Boolean) ?? []

  const { data: allTags = [], isLoading: loadingTags } = useQuery({
    queryKey: ['workout-tags'],
    queryFn: listTags,
    enabled: !!user,
  })

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    load(currentPage, currentLimit, filterTagIds)
  }, [user, navigate, currentPage, currentLimit, searchParams.get('tagIds')])

  async function load(page: number, limit: number, tagIds: string[]) {
    try {
      setLoading(true)
      const result = await listWorkoutSessions(page, limit, tagIds)
      setSessions(result.data)
      setPagination(result.meta)
    } finally {
      setLoading(false)
    }
  }

  function handlePageChange(page: number) {
    const params: Record<string, string> = {
      page: page.toString(),
      limit: currentLimit.toString(),
    }
    if (filterTagIds.length) params.tagIds = filterTagIds.join(',')
    setSearchParams(params)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function toggleFilterTag(tagId: string) {
    const next = filterTagIds.includes(tagId)
      ? filterTagIds.filter((id) => id !== tagId)
      : [...filterTagIds, tagId]
    const params: Record<string, string> = {
      page: '1',
      limit: currentLimit.toString(),
    }
    if (next.length) params.tagIds = next.join(',')
    setSearchParams(params)
  }

  function openEditTags(session: WorkoutSession) {
    setEditingSession(session)
    setEditTags(fromSessionTags(session.tags))
  }

  async function saveEditTags() {
    if (!editingSession) return
    setSavingTags(true)
    try {
      const updated = await updateWorkoutSession(
        editingSession.id,
        toSessionTagsPayload(editTags),
      )
      setSessions((prev) =>
        prev.map((s) =>
          s.id === editingSession.id ? { ...s, tags: updated.tags ?? [] } : s,
        ),
      )
      await queryClient.invalidateQueries({ queryKey: ['workout-tags'] })
      toast({ variant: 'success', title: t('tags.saved') })
      setEditingSession(null)
    } catch {
      toast({ variant: 'error', title: t('tags.saveError') })
    } finally {
      setSavingTags(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await api.delete(`/workouts/${id}`)
      toast({
        variant: 'success',
        title: t('workouts.workoutDeleted'),
      })
      await load(currentPage, currentLimit, filterTagIds)
    } finally {
      setDeletingId(null)
      setConfirmId(null)
    }
  }

  async function handleCopy(id: string) {
    setCopyingId(id)
    try {
      const session = await copyWorkout(id)
      toast({
        variant: 'success',
        title: t('workouts.workoutCopied'),
      })
      navigate(`/app/workouts/${session.id}`)
    } catch {
      toast({
        variant: 'error',
        title: t('workouts.copyError'),
      })
    } finally {
      setCopyingId(null)
      setCopyConfirmId(null)
    }
  }

  return (
    <div className="max-w-3xl lg:max-w-none mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-100">{t('workouts.history')}</h1>
        <p className="text-sm text-gray-400 mt-1">
          {t('workouts.historyDescription')}
        </p>
      </header>

      <div className="space-y-2">
        <p className="text-sm text-gray-400">{t('tags.filter')}</p>
        {loadingTags ? (
          <p className="text-xs text-gray-500">{t('common.loading')}</p>
        ) : allTags.length === 0 ? (
          <p className="text-xs text-gray-500">{t('tags.noTagsYet')}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => {
              const active = filterTagIds.includes(tag.id)
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleFilterTag(tag.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition
                    ${
                      active
                        ? 'border-primary bg-primary/20 text-primary'
                        : 'border-gray-700 text-gray-400 hover:border-primary hover:text-primary'
                    }`}
                >
                  {tag.name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="space-y-5">
        {loading ? (
          <p className="text-gray-400 text-center py-8">{t('common.loadingSessions')}</p>
        ) : sessions.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            {filterTagIds.length ? t('tags.noMatch') : t('tags.empty')}
          </p>
        ) : (
          sessions.map((s) => (
            <div
              key={s.id}
              className="bg-[#181818] rounded-xl p-5 border border-gray-800 shadow-sm transition-all duration-200 ease-in-out hover:shadow-lg hover:-translate-y-0.5 hover:border-gray-700"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <h2 className="font-semibold text-lg text-gray-100">
                    {s.title ?? t('workouts.freeWorkout')}
                  </h2>

                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(s.startAt).toLocaleString(
                      i18n.language === 'pt' ? 'pt-BR' : 'en-US',
                    )}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {s.endAt ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-green-900/20 text-green-400 border border-green-800/30 font-medium">
                        {t('status.finished')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-yellow-900/20 text-yellow-400 border border-yellow-800/30 font-medium">
                        {t('status.inProgress')}
                      </span>
                    )}

                    {(s.tags ?? []).map((tag) => (
                      <span
                        key={tag.id}
                        className="text-xs px-2 py-1 rounded-full border border-gray-700 text-gray-300"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => openEditTags(s)}
                    className="p-2 rounded-md bg-[#101010] text-gray-400 hover:text-gray-200 border border-gray-800 transition"
                    aria-label={t('tags.edit')}
                    title={t('tags.edit')}
                  >
                    <Tag className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setCopyConfirmId(s.id)}
                    disabled={copyingId === s.id}
                    className={`
                    p-2 rounded-md border transition
                    ${
                      copyingId === s.id
                        ? 'opacity-50 cursor-not-allowed bg-[#101010] text-gray-500 border-gray-800'
                        : 'bg-[#101010] text-gray-400 hover:text-gray-200 border-gray-800'
                    }
                  `}
                    aria-label={t('workout.copyWorkout')}
                    title={t('workout.copyWorkout')}
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() =>
                      navigate(
                        s.endAt
                          ? `/app/workouts/${s.id}/view`
                          : `/app/workouts/${s.id}`,
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
                open={copyConfirmId === s.id}
                title={t('dialog.copyWorkout')}
                message={t('dialog.copyWorkoutMessage', {
                  title: s.title ?? t('workouts.freeWorkout'),
                })}
                confirmText={t('workout.copyWorkout')}
                cancelText={t('common.cancel')}
                onConfirm={() => handleCopy(s.id)}
                onCancel={() => setCopyConfirmId(null)}
              />

              <ConfirmDialog
                open={confirmId === s.id}
                title={t('dialog.deleteWorkout')}
                message={t('dialog.deleteWorkoutMessage')}
                confirmText={t('common.delete')}
                cancelText={t('common.cancel')}
                onConfirm={() => handleDelete(s.id)}
                onCancel={() => setConfirmId(null)}
              />
            </div>
          ))
        )}
      </div>

      {!loading && sessions.length > 0 && (
        <Pagination meta={pagination} onPageChange={handlePageChange} />
      )}

      {editingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#181818] border border-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-100 mb-4">
              {t('tags.edit')}
            </h2>
            <WorkoutTagPicker value={editTags} onChange={setEditTags} disabled={savingTags} />
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingSession(null)}
                disabled={savingTags}
                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={saveEditTags}
                disabled={savingTags}
                className="px-4 py-2 bg-primary text-black text-sm font-semibold rounded-md hover:brightness-110 transition disabled:opacity-70"
              >
                {savingTags ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
