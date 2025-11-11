import { api } from '@/lib/api'

export type TemplateItemInput = {
  exerciseId: string
  order: number
  target?: string
}

export type WorkoutTemplate = {
  id: string
  title: string
  items: {
    id: string
    order: number
    target?: string
    exercise: {
      id: string
      name: string
      muscleGroup?: string | null
    }
  }[]
  createdAt: string
}

export async function listWorkoutTemplates(): Promise<WorkoutTemplate[]> {
  const { data } = await api.get('/templates')
  return data
}

export async function getWorkoutTemplate(id: string): Promise<WorkoutTemplate> {
  const { data } = await api.get(`/templates/${id}`)
  return data
}

export async function createWorkoutTemplate(payload: {
  title: string
  items: TemplateItemInput[]
}): Promise<WorkoutTemplate> {
  const { data } = await api.post('/templates', payload)
  return data
}

export async function deleteWorkoutTemplate(id: string): Promise<void> {
  await api.delete(`/templates/${id}`)
}
