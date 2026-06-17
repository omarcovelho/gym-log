import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Loader2, Check, X, Pencil, Trash2 } from 'lucide-react'
import { listTags, createTag, updateTag, deleteTag } from '@/api/workoutTags'
import { useAuth } from '@/auth/AuthContext'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useToast } from '@/components/ToastProvider'

export default function WorkoutTagsManage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [creating, setCreating] = useState(false)

  const {
    data: tags = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['workout-tags'],
    queryFn: listTags,
    enabled: !!user,
  })

  useEffect(() => {
    if (!user) navigate('/login')
  }, [user, navigate])

  async function handleCreate() {
    const trimmed = newTagName.trim()
    if (!trimmed || creating) return

    setCreating(true)
    try {
      await createTag(trimmed)
      await queryClient.invalidateQueries({ queryKey: ['workout-tags'] })
      toast({ variant: 'success', title: t('tags.created') })
      setNewTagName('')
      setShowCreate(false)
    } catch {
      toast({ variant: 'error', title: t('tags.createError') })
    } finally {
      setCreating(false)
    }
  }

  async function handleRename(id: string) {
    const trimmed = editName.trim()
    if (!trimmed) return
    setSavingId(id)
    try {
      await updateTag(id, trimmed)
      await queryClient.invalidateQueries({ queryKey: ['workout-tags'] })
      toast({ variant: 'success', title: t('tags.renamed') })
      setEditingId(null)
    } catch {
      toast({ variant: 'error', title: t('tags.renameError') })
    } finally {
      setSavingId(null)
    }
  }

  async function handleDelete(id: string) {
    setSavingId(id)
    try {
      await deleteTag(id)
      await queryClient.invalidateQueries({ queryKey: ['workout-tags'] })
      toast({ variant: 'success', title: t('tags.deleted') })
      setDeleteId(null)
    } catch {
      toast({ variant: 'error', title: t('tags.deleteError') })
    } finally {
      setSavingId(null)
    }
  }

  if (isLoading) {
    return <p className="text-gray-400 text-center mt-8">{t('common.loading')}</p>
  }

  if (isError) {
    return <p className="text-center text-red-500 mt-12">{t('tags.loadError')}</p>
  }

  return (
    <div className="max-w-3xl lg:max-w-none mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">{t('tags.manageTitle')}</h1>
          <p className="text-sm text-gray-400 mt-1">{t('tags.manageDescription')}</p>
        </div>

        {!showCreate && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="w-full sm:w-auto px-4 py-2 bg-primary text-black rounded-lg font-semibold text-sm shadow-md hover:brightness-110 transition text-center"
          >
            {t('tags.newTagButton')}
          </button>
        )}
      </div>

      {showCreate && (
        <div className="flex items-center gap-2 bg-[#181818] border border-gray-800 rounded-xl p-4">
          <input
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void handleCreate()
              }
              if (e.key === 'Escape') {
                setShowCreate(false)
                setNewTagName('')
              }
            }}
            placeholder={t('tags.createPlaceholder')}
            className="flex-1 min-w-0 rounded-md border border-gray-700 bg-[#0f0f0f] px-3 py-2 text-sm text-gray-100 focus:border-primary outline-none"
            autoFocus
          />
          <button
            type="button"
            disabled={creating || !newTagName.trim()}
            onClick={() => void handleCreate()}
            aria-label={t('tags.add')}
            className="shrink-0 p-2 rounded-md bg-primary text-black hover:brightness-110 disabled:opacity-50"
          >
            {creating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </button>
          <button
            type="button"
            disabled={creating}
            onClick={() => {
              setShowCreate(false)
              setNewTagName('')
            }}
            aria-label={t('common.cancel')}
            className="shrink-0 p-2 rounded-md border border-gray-700 text-gray-400 hover:text-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {tags.length === 0 && !showCreate && (
        <p className="text-gray-400 text-center mt-12">{t('tags.noTagsYet')}</p>
      )}

      <div className="space-y-5">
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="bg-[#181818] rounded-xl p-5 border border-gray-800 shadow-sm transition-all duration-200 ease-in-out hover:shadow-lg hover:-translate-y-0.5 hover:border-gray-700"
          >
            <div className="flex justify-between items-start gap-4">
              {editingId === tag.id ? (
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleRename(tag.id)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  className="flex-1 min-w-0 rounded-md border border-gray-700 bg-[#0f0f0f] px-3 py-2 text-sm text-gray-100 focus:border-primary outline-none"
                  autoFocus
                />
              ) : (
                <div>
                  <h2 className="font-semibold text-lg text-gray-100">{tag.name}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t('tags.sessionCount', { count: tag.sessionCount ?? 0 })}
                  </p>
                </div>
              )}

              <div className="flex gap-2 flex-shrink-0">
                {editingId === tag.id ? (
                  <>
                    <button
                      onClick={() => handleRename(tag.id)}
                      disabled={savingId === tag.id}
                      className="px-3 py-1.5 text-sm bg-primary text-black rounded-md font-medium"
                    >
                      {t('common.save')}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 text-sm text-gray-400"
                    >
                      {t('common.cancel')}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditingId(tag.id)
                        setEditName(tag.name)
                      }}
                      className="p-2 rounded-md bg-[#101010] text-gray-400 hover:text-gray-200 border border-gray-800 transition"
                      aria-label={t('tags.rename')}
                      title={t('tags.rename')}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(tag.id)}
                      className="p-2 rounded-md bg-[#101010] text-gray-400 hover:text-gray-200 border border-gray-800 transition"
                      aria-label={t('common.delete')}
                      title={t('common.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <ConfirmDialog
              open={deleteId === tag.id}
              title={t('tags.deleteTitle')}
              message={t('tags.deleteMessage', { name: tag.name })}
              confirmText={t('common.delete')}
              cancelText={t('common.cancel')}
              onConfirm={() => handleDelete(tag.id)}
              onCancel={() => setDeleteId(null)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
