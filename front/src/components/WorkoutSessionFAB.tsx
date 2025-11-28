import { Timer } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type Props = {
  onTimerClick: () => void
  hasActiveTimer?: boolean
  size?: 'mobile' | 'desktop'
}

export function WorkoutSessionFAB({ onTimerClick, hasActiveTimer = false, size = 'mobile' }: Props) {
  const { t } = useTranslation()
  
  const isMobile = size === 'mobile'
  const buttonSize = isMobile ? 'w-12 h-12' : 'w-16 h-16'
  const iconSize = isMobile ? 'w-6 h-6' : 'w-8 h-8'
  
  return (
    <div className={`relative ${isMobile ? '-mt-2' : 'fixed bottom-6 right-6 z-40 group'}`}>
      {/* Tooltip/Label - Visível no hover (desktop) */}
      {!isMobile && (
        <div className="hidden md:block absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-gray-900 text-gray-100 text-sm font-medium px-3 py-2 rounded-lg whitespace-nowrap shadow-lg border border-gray-700">
            {t('workout.startRest', 'Iniciar Descanso')}
            <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
          </div>
        </div>
      )}
      
      {/* Botão */}
      <button
        onClick={onTimerClick}
        className={`${buttonSize} bg-primary text-dark rounded-full shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-110 active:scale-95 transition-all flex items-center justify-center relative`}
        aria-label={t('workout.startRest', 'Iniciar Descanso')}
        title={t('workout.startRest', 'Iniciar Descanso')}
      >
        <Timer className={iconSize} strokeWidth={2.5} />
        
        {/* Badge quando timer está ativo */}
        {hasActiveTimer && (
          <span className="absolute top-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-dark"></span>
        )}
      </button>
    </div>
  )
}

