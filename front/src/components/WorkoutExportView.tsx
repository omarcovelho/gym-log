import { useTranslation } from 'react-i18next'
import type { WorkoutSession } from '@/api/workoutSession'

type Props = {
  session: WorkoutSession
}

export function WorkoutExportView({ session }: Props) {
  const { t, i18n } = useTranslation()

  const humanDate = new Date(session.startAt).toLocaleDateString(
    i18n.language === 'pt' ? 'pt-BR' : 'en-US',
    {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }
  )

  const duration =
    session.startAt && session.endAt
      ? Math.round(
          (new Date(session.endAt).getTime() - new Date(session.startAt).getTime()) / 60000
        )
      : null

  const totalSets = session.exercises.reduce((acc, e) => acc + e.sets.length, 0)
  const totalVolume = session.exercises.reduce((acc, ex) => {
    return (
      acc +
      ex.sets.reduce((setAcc, set) => {
        if (set.actualLoad && set.actualReps) {
          return setAcc + set.actualLoad * set.actualReps
        }
        return setAcc
      }, 0)
    )
  }, 0)

  // Agrupar exercícios por grupo muscular e pegar o top de cada grupo
  const exercisesByGroup = new Map<string, typeof session.exercises>()
  
  session.exercises.forEach((ex) => {
    const muscleGroup = ex.exercise.muscleGroup
    // Filtrar grupos null ou OTHER
    if (!muscleGroup || muscleGroup === 'OTHER') return
    
    if (!exercisesByGroup.has(muscleGroup)) {
      exercisesByGroup.set(muscleGroup, [])
    }
    exercisesByGroup.get(muscleGroup)!.push(ex)
  })
  
  // Para cada grupo, encontrar o exercício com maior volume
  const topExercisesByGroup = Array.from(exercisesByGroup.entries())
    .map(([muscleGroup, exercises]) => {
      const exercisesWithVolume = exercises.map((ex) => {
        const volume = ex.sets.reduce(
          (acc, s) => (s.actualLoad && s.actualReps ? acc + s.actualLoad * s.actualReps : acc),
          0
        )
        return { exercise: ex, volume }
      })
      
      // Encontrar o exercício com maior volume do grupo
      const topExercise = exercisesWithVolume.reduce((max, current) => 
        current.volume > max.volume ? current : max
      )
      
      return {
        muscleGroup,
        exercise: topExercise.exercise,
        volume: topExercise.volume,
      }
    })
    // Ordenar por volume total (maior primeiro)
    .sort((a, b) => b.volume - a.volume)
    // Limitar a 8 grupos para não ficar muito longo
    .slice(0, 8)

  return (
    <div
      id="workout-export-view"
      style={{
        width: '1080px',
        minHeight: '1920px',
        backgroundColor: '#0f0f0f',
        color: '#ffffff',
        padding: '80px 60px',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'absolute',
        left: '-9999px',
        top: '0',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '60px' }}>
        <h1
          style={{
            fontSize: '72px',
            fontWeight: 'bold',
            marginBottom: '40px',
            color: '#00E676',
            lineHeight: '1.3',
            letterSpacing: '-1px',
          }}
        >
          {session.title || t('workout.customWorkout')}
        </h1>
        <div style={{ marginBottom: '25px' }}>
          <p style={{ fontSize: '30px', color: '#9CA3AF', lineHeight: '1.6', marginBottom: '0' }}>
            {humanDate}
          </p>
        </div>
        {duration && (
          <div>
            <p style={{ fontSize: '28px', color: '#9CA3AF', lineHeight: '1.6', marginBottom: '0' }}>
              {duration} {t('workout.minutes')}
            </p>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '30px',
          marginBottom: '60px',
        }}
      >
        <div style={{ backgroundColor: '#151515', padding: '30px', borderRadius: '16px' }}>
          <p style={{ fontSize: '24px', color: '#9CA3AF', marginBottom: '10px', lineHeight: '1.3' }}>
            {t('workout.exercises')}
          </p>
          <p style={{ fontSize: '56px', fontWeight: 'bold', color: '#00E676', lineHeight: '1.2' }}>
            {session.exercises.length}
          </p>
        </div>
        <div style={{ backgroundColor: '#151515', padding: '30px', borderRadius: '16px' }}>
          <p style={{ fontSize: '24px', color: '#9CA3AF', marginBottom: '10px', lineHeight: '1.3' }}>
            {t('workout.sets')}
          </p>
          <p style={{ fontSize: '56px', fontWeight: 'bold', color: '#00E676', lineHeight: '1.2' }}>
            {totalSets}
          </p>
        </div>
        {totalVolume > 0 && (
          <div
            style={{
              backgroundColor: '#151515',
              padding: '30px',
              borderRadius: '16px',
              gridColumn: '1 / -1',
            }}
          >
            <p style={{ fontSize: '24px', color: '#9CA3AF', marginBottom: '10px', lineHeight: '1.3' }}>
              {t('workout.volume')}
            </p>
            <p style={{ fontSize: '56px', fontWeight: 'bold', color: '#00E676', lineHeight: '1.2' }}>
              {Math.round(totalVolume).toLocaleString(i18n.language === 'pt' ? 'pt-BR' : 'en-US')}{' '}
              {t('workout.kg')}
            </p>
          </div>
        )}
      </div>

      {/* Top Exercises by Muscle Group */}
      <div style={{ flex: 1, marginBottom: '40px' }}>
        <h2
          style={{
            fontSize: '40px',
            fontWeight: 'bold',
            marginBottom: '30px',
            color: '#ffffff',
            lineHeight: '1.3',
          }}
        >
          {t('workout.exercises')}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {topExercisesByGroup.map(({ muscleGroup, exercise: ex, volume: exerciseVolume }) => {
            // Normalizar FULLBODY para FULL_BODY para tradução
            const muscleGroupKey = muscleGroup === 'FULLBODY' ? 'FULL_BODY' : muscleGroup
            return (
              <div
                key={ex.id}
                style={{
                  backgroundColor: '#151515',
                  padding: '25px',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <p style={{ fontSize: '20px', color: '#9CA3AF', marginBottom: '6px', lineHeight: '1.3', textTransform: 'uppercase' }}>
                    {t(`muscleGroups.${muscleGroupKey}`)}
                  </p>
                  <p style={{ fontSize: '32px', fontWeight: '600', marginBottom: '8px', lineHeight: '1.3' }}>
                    {ex.exercise.name}
                  </p>
                  <p style={{ fontSize: '24px', color: '#9CA3AF', lineHeight: '1.4' }}>
                    {ex.sets.length} {t('workout.sets')}
                  </p>
                </div>
                {exerciseVolume > 0 && (
                  <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#00E676', lineHeight: '1.2' }}>
                    {Math.round(exerciseVolume).toLocaleString(i18n.language === 'pt' ? 'pt-BR' : 'en-US')}{' '}
                    {t('workout.kg')}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '40px',
          borderTop: '2px solid #374151',
        }}
      >
        <div style={{ display: 'flex', gap: '30px' }}>
          {session.feeling && (
            <div>
              <p style={{ fontSize: '24px', color: '#9CA3AF', marginBottom: '8px', lineHeight: '1.3' }}>
                {t('workout.feeling')}
              </p>
              <p style={{ fontSize: '32px', fontWeight: '600', color: '#ffffff', lineHeight: '1.3' }}>
                {t(`feelings.${session.feeling}`)}
              </p>
            </div>
          )}
          {session.fatigue != null && (
            <div>
              <p style={{ fontSize: '24px', color: '#9CA3AF', marginBottom: '8px', lineHeight: '1.3' }}>
                {t('workout.fatigue')}
              </p>
              <p style={{ fontSize: '32px', fontWeight: '600', color: '#ffffff', lineHeight: '1.3' }}>
                {session.fatigue}/10
              </p>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        <p style={{ fontSize: '28px', color: '#00E676', fontWeight: 'bold', lineHeight: '1.2' }}>GymLog</p>
          <img
            src="/icon-192x192.png"
            alt="GymLog"
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '10px',
            }}
          />
        </div>
      </div>
    </div>
  )
}

