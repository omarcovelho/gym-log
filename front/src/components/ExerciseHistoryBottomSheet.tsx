import { createPortal } from 'react-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { X, Loader2, Tag } from 'lucide-react'
import {
  getExerciseHistory,
  type ExerciseHistorySession,
} from '@/api/workoutSession'
import { listTags } from '@/api/workoutTags'

type Props = {
  open: boolean
  onClose: () => void
  exerciseId: string
  exerciseName: string
}

const PAGE_SIZE = 5

export function ExerciseHistoryBottomSheet({
  open,
  onClose,
  exerciseId,
  exerciseName,
}: Props) {
  const { t, i18n } = useTranslation()
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchCurrent, setTouchCurrent] = useState<number | null>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const SWIPE_THRESHOLD = 50

  useEffect(() => {
    if (!open) {
      setSelectedTagIds([])
    }
  }, [open])

  useEffect(() => {
    setSelectedTagIds([])
  }, [exerciseId])

  const { data: tags = [], isLoading: loadingTags } = useQuery({
    queryKey: ['workout-tags'],
    queryFn: listTags,
    enabled: open,
  })

  const {
    data,
    isPending,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['exercise-history', exerciseId, selectedTagIds],
    queryFn: ({ pageParam }) =>
      getExerciseHistory(exerciseId, {
        page: pageParam,
        limit: PAGE_SIZE,
        tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined,
    enabled: open && !!exerciseId,
    staleTime: 2 * 60 * 1000,
  })

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    )
  }

  const history = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  )

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    const root = listRef.current
    const sentinel = sentinelRef.current
    if (!open || !root || !sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage()
        }
      },
      { root, rootMargin: '80px', threshold: 0 },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [open, hasNextPage, isFetchingNextPage, fetchNextPage, history.length])

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY)
    setTouchCurrent(e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return
    const currentY = e.touches[0].clientY
    setTouchCurrent(currentY)

    if (currentY > touchStart && sheetRef.current) {
      const diff = currentY - touchStart
      sheetRef.current.style.transform = `translateY(${Math.min(diff, 100)}px)`
    }
  }

  const handleTouchEnd = () => {
    if (touchStart === null || touchCurrent === null) return

    const diff = touchCurrent - touchStart
    if (diff > SWIPE_THRESHOLD) {
      onClose()
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = 'translateY(0)'
    }

    setTouchStart(null)
    setTouchCurrent(null)
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return t('workout.today')
    } else if (diffDays === 1) {
      return t('workout.yesterday')
    } else if (diffDays < 7) {
      return t('workout.daysAgo', { count: diffDays })
    }
    return date.toLocaleDateString(i18n.language === 'pt' ? 'pt-BR' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const fmtIntensityBlocks = (set: ExerciseHistorySession['sets'][0]) => {
    if (
      !set.intensityType ||
      set.intensityType === 'NONE' ||
      !set.intensityBlocks ||
      set.intensityBlocks.length === 0
    ) {
      return null
    }

    const sortedBlocks = [...set.intensityBlocks].sort(
      (a, b) => a.blockIndex - b.blockIndex,
    )
    const intensityTypeLabel =
      set.intensityType === 'REST_PAUSE'
        ? t('workout.intensityRestPause')
        : set.intensityType === 'DROP_SET'
          ? t('workout.intensityDropSet')
          : set.intensityType === 'CLUSTER_SET'
            ? t('workout.intensityClusterSet')
            : ''

    const blocksFormatted = sortedBlocks
      .map((block) => {
        if (set.intensityType === 'REST_PAUSE') {
          const parts: string[] = []
          if (block.reps != null) parts.push(`${block.reps} ${t('workout.repsLabel')}`)
          if (block.restSeconds != null)
            parts.push(`${block.restSeconds} ${t('workout.seconds')}`)
          return parts.length > 0 ? parts.join(' · ') : null
        } else if (set.intensityType === 'DROP_SET') {
          const parts: string[] = []
          if (block.load != null) parts.push(`${block.load} ${t('workout.kg')}`)
          if (block.reps != null) parts.push(`${block.reps} ${t('workout.repsLabel')}`)
          return parts.length > 0 ? parts.join(' · ') : null
        } else if (set.intensityType === 'CLUSTER_SET') {
          const parts: string[] = []
          if (block.reps != null) parts.push(`${block.reps} ${t('workout.repsLabel')}`)
          if (block.restSeconds != null)
            parts.push(`${block.restSeconds} ${t('workout.seconds')}`)
          return parts.length > 0 ? parts.join(' · ') : null
        }
        return null
      })
      .filter((formatted): formatted is string => formatted !== null)

    if (blocksFormatted.length === 0) return null

    return {
      type: set.intensityType,
      typeLabel: intensityTypeLabel,
      blocks: blocksFormatted,
    }
  }

  const formatSet = (set: ExerciseHistorySession['sets'][0]): string => {
    const parts: string[] = []
    if (set.actualLoad != null) {
      parts.push(`${set.actualLoad}${t('workout.kg')}`)
    }
    if (set.actualReps != null) {
      parts.push(`× ${set.actualReps} ${t('workout.repsLabel')}`)
    }
    if (set.actualRir != null) {
      parts.push(`(${t('workout.rir')} ${set.actualRir})`)
    }
    return parts.join(' ')
  }

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center sm:justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="absolute inset-0 bg-black/60" />

      <div
        ref={sheetRef}
        className="relative w-full sm:max-w-lg sm:rounded-lg bg-dark border-t sm:border border-gray-700 shadow-xl max-h-[80vh] flex flex-col overflow-hidden"
        style={{
          transition: touchStart === null ? 'transform 0.3s ease-out' : 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-gray-600 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-100 truncate">
              {t('workout.historyForExercise', { name: exerciseName })}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="ml-3 p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition flex-shrink-0"
            style={{ minWidth: '44px', minHeight: '44px' }}
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-gray-800 flex-shrink-0 space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Tag className="w-3.5 h-3.5" />
            <span>{t('tags.filter')}</span>
          </div>
          {loadingTags ? (
            <p className="text-xs text-gray-500">{t('common.loading')}</p>
          ) : tags.length === 0 ? (
            <p className="text-xs text-gray-500">{t('tags.noTagsYet')}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const active = selectedTagIds.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
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

        <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4">
          {isPending && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-gray-400">{t('common.loading')}</p>
            </div>
          )}

          {!isPending && history.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-gray-400 text-center">
                {selectedTagIds.length > 0
                  ? t('workout.noHistoryForTag')
                  : t('workout.noHistory')}
              </p>
            </div>
          )}

          {!isPending && history.length > 0 && (
            <div className="space-y-4">
              {history.map((session) => (
                <div key={session.sessionId} className="space-y-2">
                  <div className="border-b border-gray-800 pb-2">
                    <div className="text-xs text-gray-500 mb-1">
                      {formatDate(session.sessionDate)}
                    </div>
                    {session.sessionTitle && (
                      <div className="text-sm font-medium text-gray-300 truncate">
                        {session.sessionTitle}
                      </div>
                    )}
                  </div>

                  {session.sets.length > 0 ? (
                    <div className="space-y-2">
                      {session.sets.map((set, idx) => {
                        const intensityInfo = fmtIntensityBlocks(set)
                        const hasIntensityBlocks = intensityInfo !== null

                        return (
                          <div
                            key={`${session.sessionId}-${set.setIndex}-${idx}`}
                            className="rounded-lg border border-gray-800 bg-[#101010] px-3 py-2"
                            style={{ minHeight: '44px' }}
                          >
                            <div className="flex flex-col gap-1">
                              <div className="text-sm text-gray-200">
                                <span className="text-gray-400">
                                  {t('workout.setNumber', {
                                    number: set.setIndex + 1,
                                  })}
                                  :
                                </span>{' '}
                                {formatSet(set)}
                              </div>
                              {hasIntensityBlocks && (
                                <div className="text-xs text-gray-500 mt-1">
                                  <div className="text-gray-600 font-medium mb-0.5">
                                    {intensityInfo.typeLabel}:
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                    {intensityInfo.blocks.map(
                                      (block, blockIdx) => (
                                        <div key={blockIdx} className="pl-2">
                                          {block}
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 py-2">
                      {t('workout.noCompletedSets')}
                    </div>
                  )}
                </div>
              ))}

              <div ref={sentinelRef} className="h-4" aria-hidden />

              {isFetchingNextPage && (
                <div className="flex items-center justify-center gap-2 py-3 text-sm text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('workout.loadingMoreHistory')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
