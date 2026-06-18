import { api } from '@/lib/api'

export type WorkoutTag = {
  id: string
  name: string
  nameNorm?: string
  createdAt?: string
  sessionCount?: number
}

export type SessionTagsPayload = {
  tagIds?: string[]
  newTagNames?: string[]
}

export async function listTags(): Promise<WorkoutTag[]> {
  const { data } = await api.get<WorkoutTag[]>('/tags')
  return data
}

export async function createTag(name: string): Promise<WorkoutTag> {
  const { data } = await api.post<WorkoutTag>('/tags', { name })
  return data
}

export async function updateTag(id: string, name: string): Promise<WorkoutTag> {
  const { data } = await api.patch<WorkoutTag>(`/tags/${id}`, { name })
  return data
}

export async function deleteTag(id: string): Promise<void> {
  await api.delete(`/tags/${id}`)
}
