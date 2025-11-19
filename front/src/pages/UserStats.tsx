import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getUserStats, updateUserStats } from '@/api/user'
import { useToast } from '@/components/ToastProvider'
import { User } from 'lucide-react'

const schema = z.object({
  name: z.string().optional(),
  height: z.number().min(0, 'Altura deve ser maior que 0').max(300, 'Altura inválida'),
  weight: z.number().min(0, 'Peso deve ser maior que 0').max(500, 'Peso inválido'),
})

type Form = z.infer<typeof schema>

export default function UserStats() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: stats, isLoading, refetch: refetchStats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: getUserStats,
  })

  const { register, handleSubmit, formState, reset } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: stats?.name || '',
      height: stats?.height || undefined,
      weight: stats?.weight || undefined,
    },
  })

  // Reset form when stats are loaded
  React.useEffect(() => {
    if (stats) {
      reset({
        name: stats.name || '',
        height: stats.height || undefined,
        weight: stats.weight || undefined,
      })
    }
  }, [stats, reset])

  const mutation = useMutation({
    mutationFn: updateUserStats,
    onSuccess: async () => {
      // Invalidate and refetch stats before navigating
      await queryClient.invalidateQueries({ queryKey: ['user-stats'] })
      await refetchStats()
      toast({
        title: 'Dados salvos!',
        description: 'Suas informações foram atualizadas com sucesso.',
        variant: 'success',
      })
      // Navigate after stats are updated
      navigate('/app')
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar os dados',
        variant: 'error',
      })
    },
  })

  const onSubmit = async (data: Form) => {
    await mutation.mutateAsync({
      name: data.name,
      height: data.height,
      weight: data.weight,
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="text-gray-400 text-sm">Carregando...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark text-gray-100 p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-100">Seus Dados</h1>
          </div>
          <p className="text-gray-400 text-sm">
            {stats && stats.height !== null && stats.weight !== null
              ? 'Atualize suas informações pessoais'
              : 'Preencha suas informações para começar a usar o app'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Nome */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Nome
            </label>
            <input
              id="name"
              type="text"
              className="w-full px-4 py-3 bg-[#101010] border border-gray-800 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-primary transition"
              placeholder="Seu nome"
              {...register('name')}
            />
            {formState.errors.name && (
              <p className="mt-1 text-sm text-red-500">{formState.errors.name.message}</p>
            )}
          </div>

          {/* Altura */}
          <div>
            <label htmlFor="height" className="block text-sm font-medium text-gray-300 mb-2">
              Altura (cm)
            </label>
            <input
              id="height"
              type="number"
              step="0.1"
              className="w-full px-4 py-3 bg-[#101010] border border-gray-800 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-primary transition"
              placeholder="Ex: 175"
              {...register('height', { valueAsNumber: true })}
            />
            {formState.errors.height && (
              <p className="mt-1 text-sm text-red-500">{formState.errors.height.message}</p>
            )}
          </div>

          {/* Peso */}
          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-gray-300 mb-2">
              Peso (kg)
            </label>
            <input
              id="weight"
              type="number"
              step="0.1"
              className="w-full px-4 py-3 bg-[#101010] border border-gray-800 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-primary transition"
              placeholder="Ex: 75.5"
              {...register('weight', { valueAsNumber: true })}
            />
            {formState.errors.weight && (
              <p className="mt-1 text-sm text-red-500">{formState.errors.weight.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={formState.isSubmitting || mutation.isPending}
            className="w-full px-4 py-3 bg-primary text-dark font-semibold rounded-lg hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {formState.isSubmitting || mutation.isPending ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      </div>
    </div>
  )
}

