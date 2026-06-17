import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Plus, Loader2, Check, X } from 'lucide-react'
import { createTag, listTags } from '@/api/workoutTags'
import { useAuth } from '@/auth/AuthContext'
import { useToast } from '@/components/ToastProvider'

export type WorkoutTagPickerValue = {
  tagIds: string[]
  newTagNames: string[]
}

type Props = {
  value: WorkoutTagPickerValue
  onChange: (value: WorkoutTagPickerValue) => void
  disabled?: boolean
  className?: string
}

export function WorkoutTagPicker({ value, onChange, disabled, className }: Props) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [newTagInput, setNewTagInput] = useState('')
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

  const toggleTag = (tagId: string) => {
    if (disabled) return
    const isSelected = value.tagIds.includes(tagId)
    onChange({
      tagIds: isSelected
        ? value.tagIds.filter((id) => id !== tagId)
        : [...value.tagIds, tagId],
      newTagNames: [],
    })
  }

  const handleCreateTag = async () => {
    const trimmed = newTagInput.trim()
    if (!trimmed || disabled || creating) return

    const existing = tags.find(
      (tag) => tag.name.toLowerCase() === trimmed.toLowerCase(),
    )
    if (existing) {
      if (!value.tagIds.includes(existing.id)) {
        onChange({
          tagIds: [...value.tagIds, existing.id],
          newTagNames: [],
        })
      }
      setNewTagInput('')
      setShowCreate(false)
      return
    }

    setCreating(true)
    try {
      const created = await createTag(trimmed)
      await queryClient.invalidateQueries({ queryKey: ['workout-tags'] })
      onChange({
        tagIds: value.tagIds.includes(created.id)
          ? value.tagIds
          : [...value.tagIds, created.id],
        newTagNames: [],
      })
      setNewTagInput('')
      setShowCreate(false)
    } catch {
      toast({ variant: 'error', title: t('tags.createError') })
    } finally {
      setCreating(false)
    }
  }

  const cancelCreate = () => {
    setShowCreate(false)
    setNewTagInput('')
  }

  return (
    <div className={`space-y-3 ${className ?? ''}`}>
      <label className="block text-sm font-medium text-gray-300">
        {t('tags.label')}
      </label>

      {isLoading ? (
        <p className="text-sm text-gray-500">{t('common.loading')}</p>
      ) : isError ? (
        <p className="text-sm text-red-400">{t('tags.loadError')}</p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {tags.map((tag) => {
            const selected = value.tagIds.includes(tag.id)
            return (
              <button
                key={tag.id}
                type="button"
                disabled={disabled}
                onClick={() => toggleTag(tag.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition border
                  ${
                    selected
                      ? 'border-primary bg-primary/20 text-primary'
                      : 'border-gray-700 text-gray-400 hover:border-primary hover:text-primary'
                  }`}
              >
                {tag.name}
              </button>
            )
          })}

          {showCreate ? (
            <div className="inline-flex items-center gap-0.5 min-w-0 max-w-full rounded-full border border-primary bg-primary/10 pl-3 pr-1 py-0.5">
              <input
                type="text"
                value={newTagInput}
                disabled={disabled || creating}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void handleCreateTag()
                  }
                  if (e.key === 'Escape') cancelCreate()
                }}
                placeholder={t('tags.createPlaceholder')}
                className="min-w-[4.5rem] w-24 sm:w-32 max-w-[9rem] bg-transparent text-xs text-gray-100 placeholder:text-gray-500 outline-none"
                autoFocus
              />
              <button
                type="button"
                disabled={disabled || creating || !newTagInput.trim()}
                onClick={() => void handleCreateTag()}
                aria-label={t('tags.add')}
                className="p-1.5 rounded-full text-primary hover:bg-primary/20 disabled:opacity-40 transition"
              >
                {creating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                disabled={creating}
                onClick={cancelCreate}
                aria-label={t('common.cancel')}
                className="p-1.5 rounded-full text-gray-400 hover:bg-gray-800/60 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={disabled}
              onClick={() => setShowCreate(true)}
              className="flex items-center justify-center w-8 h-8 rounded-full border border-dashed border-gray-600 text-gray-400 hover:border-primary hover:text-primary transition"
              aria-label={t('tags.createNew')}
              title={t('tags.createNew')}
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {!isLoading && !isError && tags.length === 0 && !showCreate && (
        <p className="text-xs text-gray-500">{t('tags.noTagsYet')}</p>
      )}
    </div>
  )
}

export const emptyTagPickerValue = (): WorkoutTagPickerValue => ({
  tagIds: [],
  newTagNames: [],
})

export function toSessionTagsPayload(value: WorkoutTagPickerValue) {
  return {
    tagIds: value.tagIds,
  }
}

export function fromSessionTags(
  tags: Array<{ id: string; name: string }> = [],
): WorkoutTagPickerValue {
  return {
    tagIds: tags.map((tag) => tag.id),
    newTagNames: [],
  }
}
