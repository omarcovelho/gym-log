import { api } from '@/lib/api'

export type TemplateSetInput = {
  setIndex: number
  reps?: number
  rir?: number
  notes?: string
}

export type TemplateExerciseInput = {
  exerciseId: string
  order: number
  notes?: string
  sets: TemplateSetInput[]
}

export type CreateWorkoutTemplateInput = {
  title: string
  notes?: string
  items: TemplateExerciseInput[]
}

export async function createWorkoutTemplate(payload: CreateWorkoutTemplateInput) {
  const { data } = await api.post('/workout-templates', payload)
  return data
}

export type WorkoutTemplate = {
  id: string
  title: string
  notes?: string
  items: Array<{
    id: string
    order: number
    notes?: string
    exercise: { id: string; name: string; muscleGroup?: string | null }
    sets: Array<{ id: string; setIndex: number; reps?: number; rir?: number; notes?: string }>
  }>
}

export async function listWorkoutTemplates(): Promise<WorkoutTemplate[]> {
  const { data } = await api.get('/workout-templates')
  return data
}

export async function deleteWorkoutTemplate(id: string) {
  await api.delete(`/workout-templates/${id}`)
}

export async function updateWorkoutTemplate(id: string, payload: any) {
  const { data } = await api.put(`/workout-templates/${id}`, payload)
  return data
}
