import { api } from '@/lib/api'

export type RestTimer = {
  id: string
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
  seconds: number,
): Promise<RestTimer> {
  const { data } = await api.post<RestTimer>('/rest-timers', { seconds })
  return data
}

export async function updateRestTimer(
  id: string,
  seconds: number,
): Promise<RestTimer> {
  const { data } = await api.patch<RestTimer>(`/rest-timers/${id}`, {
    seconds,
  })
  return data
}

export async function deleteRestTimer(id: string): Promise<void> {
  await api.delete(`/rest-timers/${id}`)
}

