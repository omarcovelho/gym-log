import { api } from '@/lib/api'

export type BodyMeasurement = {
  id: string
  userId: string
  date: string
  weight: number
  waist?: number | null
  arm?: number | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export type CreateBodyMeasurementDto = {
  weight: number
  waist?: number
  arm?: number
  notes?: string
  date?: string
}

export type UpdateBodyMeasurementDto = {
  weight?: number
  waist?: number
  arm?: number
  notes?: string
  date?: string
}

export type BodyMeasurementsResponse = {
  data: BodyMeasurement[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export async function createBodyMeasurement(dto: CreateBodyMeasurementDto): Promise<BodyMeasurement> {
  const { data } = await api.post<BodyMeasurement>('/body-measurements', dto)
  return data
}

export async function listBodyMeasurements(page: number = 1, limit: number = 10): Promise<BodyMeasurementsResponse> {
  const { data } = await api.get<BodyMeasurementsResponse>('/body-measurements', {
    params: { page, limit },
  })
  return data
}

export async function getBodyMeasurement(id: string): Promise<BodyMeasurement> {
  const { data } = await api.get<BodyMeasurement>(`/body-measurements/${id}`)
  return data
}

export async function updateBodyMeasurement(id: string, dto: UpdateBodyMeasurementDto): Promise<BodyMeasurement> {
  const { data } = await api.patch<BodyMeasurement>(`/body-measurements/${id}`, dto)
  return data
}

export async function deleteBodyMeasurement(id: string): Promise<void> {
  await api.delete(`/body-measurements/${id}`)
}

export async function getLatestMeasurement(): Promise<BodyMeasurement | null> {
  try {
    const { data } = await api.get<BodyMeasurement>('/body-measurements/latest')
    return data
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null
    }
    throw error
  }
}

export async function checkMeasurementToday(): Promise<boolean> {
  const { data } = await api.get<{ hasMeasurement: boolean }>('/body-measurements/check-today')
  return data.hasMeasurement
}

export type MeasurementsStats = {
  weeklyData: {
    weight: Array<{ week: string; date: string; value: number }>
    waist: Array<{ week: string; date: string; value: number }>
    arm: Array<{ week: string; date: string; value: number }>
  }
  trends: {
    weight: { change: number; changePercent: number; direction: 'up' | 'down' | 'stable' }
    waist: { change: number; changePercent: number; direction: 'up' | 'down' | 'stable' }
    arm: { change: number; changePercent: number; direction: 'up' | 'down' | 'stable' }
  }
  current: {
    weight: number | null
    waist: number | null
    arm: number | null
    date: string | null
  }
  averages: {
    weight: number | null
    waist: number | null
    arm: number | null
  }
}

export async function getMeasurementsStats(
  weeks?: number,
  startDate?: string | null,
  endDate?: string | null,
): Promise<MeasurementsStats> {
  const params: any = {}
  if (weeks) params.weeks = weeks
  if (startDate) params.startDate = startDate
  if (endDate) params.endDate = endDate
  
  const { data } = await api.get<MeasurementsStats>('/body-measurements/stats', {
    params,
  })
  return data
}

