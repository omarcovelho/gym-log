import { api } from '@/lib/api'

export type RestTimer = {
  id: string
  name: string
  seconds: number
  isDefault: boolean
  userId?: string
  createdAt?: string
  updatedAt?: string
}

export async function getRestTimers(): Promise<RestTimer[]> {
  const { data } = await api.get<RestTimer[]>('/rest-timers')
  return data
}

export async function createRestTimer(
  name: string,
  seconds: number,
): Promise<RestTimer> {
  const { data } = await api.post<RestTimer>('/rest-timers', { name, seconds })
  return data
}

export async function updateRestTimer(
  id: string,
  name: string,
  seconds: number,
): Promise<RestTimer> {
  const { data } = await api.patch<RestTimer>(`/rest-timers/${id}`, {
    name,
    seconds,
  })
  return data
}

export async function deleteRestTimer(id: string): Promise<void> {
  await api.delete(`/rest-timers/${id}`)
}

