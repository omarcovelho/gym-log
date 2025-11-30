import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Timer, ArrowLeft } from 'lucide-react'
import type { WorkoutSession } from '@/api/workoutSession'
import { WorkoutSessionFABWrapper } from './WorkoutSessionFABWrapper'

type Props = {
  session: WorkoutSession
}

export function WorkoutSessionBottomNav({ session }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [elapsedTime, setElapsedTime] = useState('')

  // Calcular sets completados e total
  const totalSets = session.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)
  const completedSets = session.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0,
  )

  // Calcular tempo decorrido
  useEffect(() => {
    const updateElapsedTime = () => {
      const startTime = new Date(session.startAt).getTime()
      const now = Date.now()
      const diff = now - startTime

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      if (hours > 0) {
        setElapsedTime(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
      } else {
        setElapsedTime(`${minutes}:${seconds.toString().padStart(2, '0')}`)
      }
    }

    updateElapsedTime()
    const interval = setInterval(updateElapsedTime, 1000)

    return () => clearInterval(interval)
  }, [session.startAt])

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f0f0f]/95 backdrop-blur-md border-t border-gray-800 md:hidden">
      <div className="max-w-5xl mx-auto px-2 py-2">
        <div className="flex items-center justify-around">
          {/* Botão de Sair */}
          <button
            onClick={() => navigate('/app/workouts')}
            className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition text-gray-400 hover:text-gray-200 hover:bg-gray-800/40"
            aria-label={t('workout.exit', 'Sair do Treino')}
            title={t('workout.exit', 'Sair do Treino')}
          >
            <ArrowLeft className="w-6 h-6" />
            <span className="text-[10px] font-medium">{t('workout.exit', 'Sair')}</span>
          </button>

          {/* Progresso de Sets */}
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-500 mb-0.5">{t('workout.sets', 'Sets')}</span>
            <span className="text-sm font-semibold text-gray-200">
              {completedSets}/{totalSets}
            </span>
          </div>

          {/* FAB Timer Centralizado */}
          <div className="flex flex-col items-center">
            <WorkoutSessionFABWrapper />
            <span className="text-[10px] font-medium text-primary mt-1">{t('workout.timer', 'Timer')}</span>
          </div>

          {/* Tempo Decorrido */}
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
              <Timer className="w-3 h-3" />
              {t('workout.elapsedTime', 'Tempo')}
            </span>
            <span className="text-sm font-semibold text-gray-200 font-mono">
              {elapsedTime || '0:00'}
            </span>
          </div>
        </div>
      </div>
    </nav>
  )
}

