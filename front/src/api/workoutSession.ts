import { api } from '@/lib/api'

/* =========================== TYPES =========================== */

export type SessionSet = {
  id: string
  setIndex: number

  // planned (do template ou adicionados no AddSetDto)
  plannedReps?: number | null
  plannedRir?: number | null

  // actual (digitados pelo usuário)
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
  startAt: string
  endAt?: string | null
  durationM?: number | null
  fatigue?: number | null
  feeling?: 'GREAT' | 'GOOD' | 'OKAY' | 'BAD' | 'TERRIBLE' | null
  notes?: string | null
  exercises: SessionExercise[]
  createdAt: string
}

/* =========================== DTOS (frontend) =========================== */

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

/* =========================== CALLS =========================== */

export async function startWorkout(templateId: string): Promise<WorkoutSession> {
  const { data } = await api.post(`/workouts/start/${templateId}`)
  return data
}

export async function getWorkoutSession(id: string): Promise<WorkoutSession> {
  const { data } = await api.get(`/workouts/${id}`)
  return data
}

export async function listWorkoutSessions(): Promise<WorkoutSession[]> {
  const { data } = await api.get(`/workouts`)
  return data
}

export async function addExerciseToSession(
  sessionId: string,
  payload: AddExerciseDto,
): Promise<SessionExercise> {
  const { data } = await api.post(`/workouts/${sessionId}/exercises`, payload)
  return data
}

export async function addSetToExercise(
  exerciseId: string,
  payload: AddSetDto = {},
): Promise<SessionSet> {
  const { data } = await api.post(`/workouts/exercises/${exerciseId}/sets`, payload)
  return data
}

export async function updateSet(setId: string, payload: UpdateSetDto): Promise<SessionSet> {
  const { data } = await api.patch(`/workouts/sets/${setId}`, payload)
  return data
}

export async function finishWorkoutSession(
  sessionId: string,
  payload?: { feeling?: 'GREAT' | 'GOOD' | 'OKAY' | 'BAD' | 'TERRIBLE'; fatigue?: number; notes?: string },
): Promise<WorkoutSession> {
  const { data } = await api.post(`/workouts/${sessionId}/finish`, payload ?? {})
  return data
}

export async function deleteWorkoutSession(id: string): Promise<void> {
  await api.delete(`/workouts/${id}`)
}

export async function startManualWorkout(): Promise<WorkoutSession> {
  const { data } = await api.post(`/workouts/free/start`)
  console.log(data);
  return data
}
