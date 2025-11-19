import { api } from '@/lib/api'

export interface UserStats {
  id: string
  email: string
  name?: string | null
  height?: number | null
  weight?: number | null
  role: string
}

export async function getUserStats(): Promise<UserStats> {
  const response = await api.get<UserStats>('/users/stats')
  return response.data
}

export async function updateUserStats(data: {
  name?: string
  height?: number
  weight?: number
}): Promise<UserStats> {
  const response = await api.put<UserStats>('/users/stats', data)
  return response.data
}

