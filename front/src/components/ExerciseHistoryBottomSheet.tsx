import { createPortal } from 'react-dom'
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { X, Loader2 } from 'lucide-react'
import { getExerciseHistory, type ExerciseHistorySession } from '@/api/workoutSession'

type Props = {
  open: boolean
  onClose: () => void
  exerciseId: string
  exerciseName: string
}

export function ExerciseHistoryBottomSheet({ open, onClose, exerciseId, exerciseName }: Props) {
  const { t, i18n } = useTranslation()
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchCurrent, setTouchCurrent] = useState<number | null>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const SWIPE_THRESHOLD = 50

  const { data: history, isLoading } = useQuery<ExerciseHistorySession[]>({
    queryKey: ['exercise-history', exerciseId],
    queryFn: () => getExerciseHistory(exerciseId, 5),
    enabled: open && !!exerciseId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  // Lock body scroll when open
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

  // Handle swipe down to close
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY)
    setTouchCurrent(e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return
    const currentY = e.touches[0].clientY
    setTouchCurrent(currentY)

    // Only allow downward swipe
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
      // Snap back
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
      return t('workout.today', 'Hoje')
    } else if (diffDays === 1) {
      return t('workout.yesterday', 'Ontem')
    } else if (diffDays < 7) {
      return t('workout.daysAgo', `Há ${diffDays} dias`, { count: diffDays })
    } else {
      return date.toLocaleDateString(i18n.language === 'pt' ? 'pt-BR' : 'en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    }
  }

  const formatSet = (set: ExerciseHistorySession['sets'][0]): string => {
    const parts: string[] = []
    if (set.actualLoad != null) {
      parts.push(`${set.actualLoad}${t('workout.kg', 'kg')}`)
    }
    if (set.actualReps != null) {
      parts.push(`× ${set.actualReps} ${t('workout.repsLabel', 'reps')}`)
    }
    if (set.actualRir != null) {
      parts.push(`(${t('workout.rir', 'RIR')} ${set.actualRir})`)
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
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Bottom Sheet */}
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
        {/* Handle Bar (mobile only) */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-100 truncate">
              {t('workout.historyForExercise', `Histórico: ${exerciseName}`, { name: exerciseName })}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="ml-3 p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition flex-shrink-0"
            style={{ minWidth: '44px', minHeight: '44px' }}
            aria-label={t('common.close', 'Fechar')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-gray-400">{t('common.loading', 'Carregando...')}</p>
            </div>
          )}

          {!isLoading && (!history || history.length === 0) && (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-gray-400 text-center">
                {t('workout.noHistory', 'Nenhum histórico disponível para este exercício')}
              </p>
            </div>
          )}

          {!isLoading && history && history.length > 0 && (
            <div className="space-y-4">
              {history.map((session) => (
                <div key={session.sessionId} className="space-y-2">
                  {/* Session Header */}
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

                  {/* Sets */}
                  {session.sets.length > 0 ? (
                    <div className="space-y-2">
                      {session.sets.map((set, idx) => (
                        <div
                          key={`${session.sessionId}-${set.setIndex}-${idx}`}
                          className="rounded-lg border border-gray-800 bg-[#101010] px-3 py-2"
                          style={{ minHeight: '44px' }}
                        >
                          <div className="text-sm text-gray-200">
                            <span className="text-gray-400">
                              {t('workout.setNumber', `Série #${set.setIndex + 1}`, { number: set.setIndex + 1 })}:
                            </span>{' '}
                            {formatSet(set)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 py-2">
                      {t('workout.noCompletedSets', 'Nenhuma série completada nesta sessão')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

