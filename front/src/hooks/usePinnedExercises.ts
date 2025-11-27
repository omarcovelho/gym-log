import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ToastProvider'
import { getPinnedExercises, pinExercise, unpinExercise } from '@/api/workoutSession'
import { useTranslation } from 'react-i18next'

const PIN_LIMIT = 5

export function usePinnedExercises() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: pinnedExerciseIds = [], isLoading } = useQuery<string[]>({
    queryKey: ['pinned-exercises'],
    queryFn: getPinnedExercises,
    staleTime: Infinity, // Pinned exercises don't change often
  })

  const pinMutation = useMutation({
    mutationFn: (exerciseId: string) => pinExercise(exerciseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pinned-exercises'] })
      queryClient.invalidateQueries({ queryKey: ['exercise-progression'] }) // Invalidate progression data
    },
    onError: (error: any) => {
      toast({
        variant: 'error',
        title: t('progress.error', 'Erro'),
        description: error?.response?.data?.message || error?.message || t('progress.errorPinning', 'Erro ao favoritar exercício'),
      })
    },
  })

  const unpinMutation = useMutation({
    mutationFn: (exerciseId: string) => unpinExercise(exerciseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pinned-exercises'] })
      queryClient.invalidateQueries({ queryKey: ['exercise-progression'] }) // Invalidate progression data
    },
    onError: (error: any) => {
      toast({
        variant: 'error',
        title: t('progress.error', 'Erro'),
        description: error?.response?.data?.message || error?.message || t('progress.errorUnpinning', 'Erro ao remover exercício dos favoritos'),
      })
    },
  })

  const isPinned = (exerciseId: string) => pinnedExerciseIds.includes(exerciseId)
  const canPinMore = pinnedExerciseIds.length < PIN_LIMIT

  return {
    pinnedExerciseIds,
    isPinned,
    canPinMore,
    pinExercise: pinMutation.mutateAsync,
    unpinExercise: unpinMutation.mutateAsync,
    isLoading,
  }
}

