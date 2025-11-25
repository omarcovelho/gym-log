import { api } from '@/lib/api'

/* ============================================================
 * TYPES
 * ============================================================ */
export type UpdateWorkoutExerciseDto = {
  order?: number
  notes?: string | null
  sets?: {
    id: string
    setIndex: number
    plannedReps?: number | null
    plannedRir?: number | null
    actualLoad?: number | null
    actualReps?: number | null
    actualRir?: number | null
    completed?: boolean
    notes?: string | null
  }[]
}
export type SessionSet = {
  id: string
  setIndex: number

  // Planned (template)
  plannedReps?: number | null
  plannedRir?: number | null

  // Actual (user)
  actualLoad?: number | null
  actualReps?: number | null
  actualRir?: number | null

  unit?: 'KG' | 'LB' | null
  completed?: boolean
  notes?: string | null
}

export type SessionExercise = {
  id: string
  order: number
  notes?: string | null
  exercise: {
    id: string
    name: string
    muscleGroup?: string | null
  }
  sets: SessionSet[]
}

export type WorkoutSession = {
  id: string
  title: string
  userId: string
  templateId?: string | null
  startAt: string
  endAt?: string | null
  durationM?: number | null
  fatigue?: number | null
  feeling?: 'GREAT' | 'GOOD' | 'OKAY' | 'BAD' | 'TERRIBLE' | null
  notes?: string | null
  exercises: SessionExercise[]
  createdAt: string
}

/* ============================================================
 * DTOS
 * ============================================================ */

export type AddExerciseDto = {
  exerciseId: string
  notes?: string
  order?: number
}

export type AddSetDto = {
  setIndex?: number
  plannedReps?: number
  plannedRir?: number
  notes?: string
}

export type UpdateSetDto = Partial<{
  actualLoad: number | null
  actualReps: number | null
  actualRir: number | null
  completed: boolean
  notes: string | null
}>

export type UpdateSessionDto = Partial<{
  title: string
  notes: string | null
  feeling: 'GREAT' | 'GOOD' | 'OKAY' | 'BAD' | 'TERRIBLE' | null
  fatigue: number | null
}>

/* ============================================================
 * API CALLS
 * ============================================================ */

/* ---------- Start workout from template ---------- */
export async function startWorkout(templateId: string): Promise<WorkoutSession> {
  const { data } = await api.post(`/workouts/start/${templateId}`)
  return data
}

/* ---------- Start workout manually (no template) ---------- */
export async function startManualWorkout(): Promise<WorkoutSession> {
  const { data } = await api.post(`/workouts/free/start`)
  return data
}

/* ---------- Retrieve single session ---------- */
export async function getWorkoutSession(id: string): Promise<WorkoutSession> {
  const { data } = await api.get(`/workouts/${id}`)
  return data
}

/* ---------- List all user sessions ---------- */
export async function listWorkoutSessions(
  page: number = 1,
  limit: number = 10,
): Promise<{ data: WorkoutSession[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
  const { data } = await api.get(`/workouts`, {
    params: { page, limit },
  })
  return data
}

/* ---------- Update workout session data (title, notes, etc) ---------- */
export async function updateWorkoutSession(
  id: string,
  payload: UpdateSessionDto,
): Promise<WorkoutSession> {
  const { data } = await api.patch(`/workouts/${id}`, payload)
  return data
}

/* ---------- Add exercise to session ---------- */
export async function addExerciseToSession(
  sessionId: string,
  payload: AddExerciseDto,
): Promise<SessionExercise> {
  const { data } = await api.post(`/workouts/${sessionId}/exercises`, payload)
  return data
}

/* ---------- Add set to exercise ---------- */
export async function addSetToExercise(
  exerciseId: string,
  payload: AddSetDto = {},
): Promise<SessionSet> {
  const { data } = await api.post(`/workouts/exercises/${exerciseId}/sets`, payload)
  return data
}

/* ---------- Update set fields ---------- */
export async function updateSet(setId: string, payload: UpdateSetDto): Promise<SessionSet> {
  const { data } = await api.patch(`/workouts/sets/${setId}`, payload)
  return data
}

/* ---------- Finish session ---------- */
export async function finishWorkoutSession(
  sessionId: string,
  payload?: {
    feeling?: 'GREAT' | 'GOOD' | 'OKAY' | 'BAD' | 'TERRIBLE'
    fatigue?: number
    notes?: string
  },
): Promise<WorkoutSession> {
  const { data } = await api.post(`/workouts/${sessionId}/finish`, payload ?? {})
  return data
}

/* ---------- Delete session ---------- */
export async function deleteWorkoutSession(id: string): Promise<void> {
  await api.delete(`/workouts/${id}`)
}

export async function updateWorkoutExercise(
  exerciseId: string,
  payload: UpdateWorkoutExerciseDto,
): Promise<SessionExercise> {
  const { data } = await api.patch(`/workouts/exercises/${exerciseId}`, payload)
  return data
}

/* ---------- Delete exercise from session ---------- */
export async function deleteExerciseFromSession(exerciseId: string): Promise<void> {
  await api.delete(`/workouts/exercises/${exerciseId}`)
}

/* ---------- Delete set from exercise ---------- */
export async function deleteSetFromExercise(setId: string): Promise<void> {
  await api.delete(`/workouts/sets/${setId}`)
}

/* ---------- Get workout statistics ---------- */
export type WorkoutStats = {
  totalWorkouts: number
  monthlyVolume: number
  recentPRs: Array<{
    exerciseName: string
    type: 'load' | 'reps' | 'volume'
    value: number
    unit?: string
  }>
  volumeHistory: Array<{
    date: string
    volume: number
  }>
  lastWorkout: {
    id: string
    title: string
    date: string
    volume: number
  } | null
}

export async function getWorkoutStats(): Promise<WorkoutStats> {
  const { data } = await api.get(`/statistics/workouts`)
  return data
}

export type EvolutionPR = {
  exerciseName: string
  value: number
  previousValue: number
  date: string
  workoutId: string
  unit: string
}

export type WeeklyStats = {
  week: string
  volume: number
  sets: number
  byMuscleGroup: {
    [muscleGroup: string]: {
      volume: number
      sets: number
    }
  }
}

export type EvolutionStats = {
  recentPRs: EvolutionPR[]
  weeklyStats: WeeklyStats[]
}

export async function getEvolutionStats(weeks?: number): Promise<EvolutionStats> {
  const params = weeks ? { weeks: weeks.toString() } : {}
  const { data } = await api.get(`/statistics/evolution`, { params })
  return data
}

/* ---------- Get active workout session (in progress) ---------- */
export async function getActiveWorkout(): Promise<WorkoutSession | null> {
  const { data } = await api.get(`/workouts/active`)
  return data
}
