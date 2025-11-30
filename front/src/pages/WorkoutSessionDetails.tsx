import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Share2, Loader2 } from 'lucide-react'
import { getWorkoutSession, type WorkoutSession, type SessionSet, type SetIntensityType } from '@/api/workoutSession'
import { useAuth } from '@/auth/AuthContext'
import { useToast } from '@/components/ToastProvider'
import { WorkoutExportView } from '@/components/WorkoutExportView'
import { generateWorkoutImage, downloadWorkoutImage, shareWorkoutImage } from '@/utils/workoutExport'

export default function WorkoutSessionDetails() {
  const { t, i18n } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [session, setSession] = useState<WorkoutSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!user) navigate('/login')
    ;(async () => {
      try {
        setLoading(true)
        const data = await getWorkoutSession(id!)
        setSession(data)
      } finally {
        setLoading(false)
      }
    })()
  }, [user, navigate, id])

  if (loading || !session)
    return <p className="text-gray-400 text-center mt-10">{t('common.loadingSession')}</p>

  const humanDate = new Date(session.startAt ?? session.startAt).toLocaleString(i18n.language === 'pt' ? 'pt-BR' : 'en-US')
  const totalSets = session.exercises.reduce((acc, e) => acc + e.sets.length, 0)
  const completedSets = session.exercises.reduce(
    (acc, e) => acc + e.sets.filter((s) => s.completed).length,
    0,
  )

  const fmtActual = (load?: number | null, reps?: number | null, rir?: number | null) => {
    const parts: string[] = []
    parts.push(load != null ? `${load} ${t('workout.kg')}` : '—')
    parts.push(`${reps ?? '—'} ${t('workout.repsLabel')}`)
    parts.push(`${t('workout.rir')} ${rir ?? '—'}`)
    return parts.join(' · ')
  }

  const fmtIntensityBlocks = (set: SessionSet) => {
    if (!set.intensityType || set.intensityType === 'NONE' || !set.intensityBlocks || set.intensityBlocks.length === 0) {
      return null
    }

    const sortedBlocks = [...set.intensityBlocks].sort((a, b) => a.blockIndex - b.blockIndex)
    const intensityTypeLabel = set.intensityType === 'REST_PAUSE' 
      ? t('workout.intensityRestPause', 'Rest-pause')
      : set.intensityType === 'DROP_SET'
      ? t('workout.intensityDropSet', 'Drop Set')
      : ''

    const blocksFormatted = sortedBlocks.map((block) => {
      if (set.intensityType === 'REST_PAUSE') {
        const parts: string[] = []
        if (block.reps != null) parts.push(`${block.reps} ${t('workout.repsLabel')}`)
        if (block.restSeconds != null) parts.push(`${block.restSeconds} ${t('workout.seconds', 'seg')}`)
        return parts.length > 0 ? parts.join(' · ') : null
      } else if (set.intensityType === 'DROP_SET') {
        const parts: string[] = []
        if (block.load != null) parts.push(`${block.load} ${t('workout.kg')}`)
        if (block.reps != null) parts.push(`${block.reps} ${t('workout.repsLabel')}`)
        return parts.length > 0 ? parts.join(' · ') : null
      }
      return null
    }).filter((formatted): formatted is string => formatted !== null)

    if (blocksFormatted.length === 0) return null

    return {
      type: set.intensityType,
      typeLabel: intensityTypeLabel,
      blocks: blocksFormatted,
    }
  }

  const duration =
    session.startAt && session.endAt
      ? Math.round(
          (new Date(session.endAt).getTime() - new Date(session.startAt).getTime()) / 60000,
        )
      : null

  const handleExport = async () => {
    if (!session || !session.endAt) return

    setExporting(true)
    try {
      // Aguardar um pouco para garantir que o componente está renderizado
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Gerar imagem
      const blob = await generateWorkoutImage()

      // Tentar compartilhar primeiro (se disponível)
      const shared = await shareWorkoutImage(blob)
      if (!shared) {
        // Se não conseguir compartilhar, fazer download
        const dateStr = new Date(session.startAt).toISOString().split('T')[0]
        const filename = `workout-${dateStr}.png`
        await downloadWorkoutImage(blob, filename)
      }

      toast({
        variant: 'success',
        title: t('workout.exportSuccess'),
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        variant: 'error',
        title: t('workout.exportError'),
      })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Componente de export (oculto, sempre renderizado quando sessão existe) */}
      {session && <WorkoutExportView session={session} />}

      <header className="space-y-1">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{session.title ?? t('workout.customWorkout')}</h1>
            <p className="text-sm text-gray-400">{humanDate}</p>
            <p className="text-xs text-gray-500">
              {t('workout.setsCompleted', { completed: completedSets, total: totalSets })}
            </p>
          </div>
          {session.endAt && (
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-dark font-semibold rounded-lg hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('workout.exporting')}</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>{t('workout.export')}</span>
                </>
              )}
            </button>
          )}
        </div>
      </header>

      {/* -------- Summary of finished session -------- */}
      {session.endAt && (
        <div className="rounded-lg border border-gray-800 bg-[#101010] p-4 space-y-2">
          <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">
            {t('workout.sessionSummary')}
          </h2>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
            <div>
              <span className="text-gray-500">{t('workout.feeling')}</span>{' '}
              <span className="font-medium text-gray-200">
                {session.feeling ? t(`feelings.${session.feeling}`) : '—'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">{t('workout.fatigue')}</span>{' '}
              <span className="font-medium text-gray-200">
                {session.fatigue ?? '—'}/10
              </span>
            </div>
            {duration != null && (
              <div>
                <span className="text-gray-500">{t('workout.duration')}</span>{' '}
                <span className="font-medium text-gray-200">{duration} {t('workout.minutes')}</span>
              </div>
            )}
            <div>
              <span className="text-gray-500">{t('workout.finishedAt')}</span>{' '}
              <span className="font-medium text-gray-200">
                {new Date(session.endAt).toLocaleTimeString(i18n.language === 'pt' ? 'pt-BR' : 'en-US')}
              </span>
            </div>
          </div>
          {session.notes && (
            <p className="text-sm text-gray-300 italic mt-2 border-t border-gray-800 pt-2">
              "{session.notes}"
            </p>
          )}
        </div>
      )}

      <div className="space-y-6">
        {[...session.exercises].sort((a, b) => a.order - b.order).map((ex) => (
          <div key={ex.id} className="rounded-xl border border-gray-800 bg-[#151515] overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-800">
              <div>
                <h3 className="text-lg font-semibold text-gray-100">{ex.exercise.name}</h3>
                <p className="text-xs uppercase text-gray-500">{ex.exercise.muscleGroup ?? ''}</p>
              </div>
            </div>

            <div className="p-4">
              <table className="w-full text-sm text-gray-300">
                <thead className="text-xs text-gray-500 border-b border-gray-800">
                  <tr>
                    <th className="text-left py-1 w-12">{t('workout.set')}</th>
                    {session.templateId && (
                      <th className="text-left py-1 w-36">{t('workout.planned')}</th>
                    )}
                    <th className="text-left py-1 min-w-[12rem]">{t('workout.actual')}</th>
                    <th className="text-left py-1">{t('workout.notes')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...ex.sets].sort((a, b) => a.setIndex - b.setIndex).map((s) => {
                    const intensityInfo = fmtIntensityBlocks(s)
                    const hasIntensityBlocks = intensityInfo !== null
                    
                    return (
                      <tr
                        key={s.id}
                        className="border-t border-gray-800"
                      >
                        <td className="py-2 whitespace-nowrap">#{s.setIndex + 1}</td>

                        {session.templateId && (
                          <td className="py-2 whitespace-nowrap">
                            {(s.plannedReps ?? '—')}{' '}
                            <span className="text-gray-500">{t('workout.repsLabel')}</span>{' '}
                            <span className="text-gray-600">·</span>{' '}
                            <span className="text-gray-500">{t('workout.rir')}</span> {s.plannedRir ?? '—'}
                          </td>
                        )}

                        <td className="py-2 min-w-0">
                          <div className="flex flex-col gap-1">
                            <span className="whitespace-nowrap">{fmtActual(s.actualLoad, s.actualReps, s.actualRir)}</span>
                            {hasIntensityBlocks && (
                              <div className="text-xs text-gray-500 mt-1">
                                <div className="text-gray-600 font-medium mb-0.5">{intensityInfo.typeLabel}:</div>
                                <div className="flex flex-col gap-0.5">
                                  {intensityInfo.blocks.map((block, idx) => (
                                    <div key={idx} className="pl-2">
                                      {block}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-2 min-w-0">
                          <span className="block truncate text-gray-400">{s.notes ?? '—'}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-gray-800 text-center">
        <Link to="/app/workouts" className="text-sm text-gray-400 hover:text-primary transition">
          {t('workout.backToHistory')}
        </Link>
      </div>
    </div>
  )
}
