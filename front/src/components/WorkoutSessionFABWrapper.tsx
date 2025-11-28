import { WorkoutSessionFAB } from './WorkoutSessionFAB'
import { useWorkoutSessionContext } from '@/pages/WorkoutSessionView'

type Props = {
  size?: 'mobile' | 'desktop'
}

export function WorkoutSessionFABWrapper({ size = 'mobile' }: Props) {
  const context = useWorkoutSessionContext()
  
  if (!context) {
    // Context não disponível, retornar null
    return null
  }
  
  return (
    <WorkoutSessionFAB
      onTimerClick={() => context.setTimerOpen(true)}
      hasActiveTimer={context.countdownActive !== null}
      size={size}
    />
  )
}

