import { api } from '@/lib/api'

export type Sleep = {
  id: string
  userId: string
  date: string
  sleepHours: number
  sleepQuality?: number | null
  sleepBedtime?: string | null
  sleepWakeTime?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export type CreateSleepDto = {
  sleepHours: number
  sleepQuality?: number
  sleepBedtime?: string
  sleepWakeTime?: string
  notes?: string
  date?: string
}

export type UpdateSleepDto = {
  sleepHours?: number
  sleepQuality?: number
  sleepBedtime?: string
  sleepWakeTime?: string
  notes?: string
  date?: string
}

export type SleepResponse = {
  data: Sleep[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export async function createSleep(dto: CreateSleepDto): Promise<Sleep> {
  const { data } = await api.post<Sleep>('/sleep', dto)
  return data
}

export async function listSleeps(page: number = 1, limit: number = 10): Promise<SleepResponse> {
  const { data } = await api.get<SleepResponse>('/sleep', {
    params: { page, limit },
  })
  return data
}

export async function getSleep(id: string): Promise<Sleep> {
  const { data } = await api.get<Sleep>(`/sleep/${id}`)
  return data
}

export async function updateSleep(id: string, dto: UpdateSleepDto): Promise<Sleep> {
  const { data } = await api.patch<Sleep>(`/sleep/${id}`, dto)
  return data
}

export async function deleteSleep(id: string): Promise<void> {
  await api.delete(`/sleep/${id}`)
}

export async function getLatestSleep(): Promise<Sleep | null> {
  try {
    const { data } = await api.get<Sleep>('/sleep/latest')
    return data
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null
    }
    throw error
  }
}

export async function checkSleepToday(): Promise<boolean> {
  const { data } = await api.get<{ hasSleep: boolean }>('/sleep/check-today')
  return data.hasSleep
}

export type SleepStats = {
  weeklyData: Array<{ week: string; date: string; value: number }>
  trend: { change: number; changePercent: number; direction: 'up' | 'down' | 'stable' }
  current: {
    sleepHours: number | null
    date: string | null
  }
  average: number | null
}

export async function getSleepStats(
  weeks?: number,
  startDate?: string | null,
  endDate?: string | null,
): Promise<SleepStats> {
  const params: any = {}
  if (weeks) params.weeks = weeks
  if (startDate) params.startDate = startDate
  if (endDate) params.endDate = endDate
  
  const { data } = await api.get<SleepStats>('/sleep/stats', {
    params,
  })
  return data
}

