import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export type Exercise = {
  id: string
  name: string
  muscleGroup?: string | null
  notes?: string | null
  isGlobal?: boolean
  createdById?: string
}

type ExercisesResponse = {
  data: Exercise[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function useExercises(params?: { page?: number; limit?: number; search?: string; muscleGroup?: string }) {
  return useQuery<ExercisesResponse>({
    queryKey: ['exercises', params],
    queryFn: async () => {
      const { data } = await api.get<ExercisesResponse>('/exercises', {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 100,
          ...(params?.search && { search: params.search }),
          ...(params?.muscleGroup && { muscleGroup: params.muscleGroup }),
        },
      })
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  })
}

export function useInvalidateExercises() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['exercises'] })
  }
}

