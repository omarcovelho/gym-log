import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createSleep,
  updateSleep,
  getSleep,
  type CreateSleepDto,
  type UpdateSleepDto,
} from '@/api/sleep'
import { useToast } from '@/components/ToastProvider'

export default function SleepForm() {
  const { t } = useTranslation()
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const schema = z.object({
    sleepHours: z.number().min(0, t('sleep.validation.hoursMin')).max(24, t('sleep.validation.hoursMax')),
    sleepQuality: z.number().min(1).max(10).optional().or(z.literal('')),
    sleepBedtime: z.string().optional(),
    sleepWakeTime: z.string().optional(),
    notes: z.string().optional(),
    date: z.string().optional(),
  })

  type Form = z.infer<typeof schema>

  // Load sleep for editing
  const { data: sleep, isLoading: loadingSleep } = useQuery({
    queryKey: ['sleep', id],
    queryFn: () => getSleep(id!),
    enabled: isEditing && !!id,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      sleepHours: undefined,
      sleepQuality: undefined,
      sleepBedtime: undefined,
      sleepWakeTime: undefined,
      notes: '',
      date: undefined,
    },
  })

  // Reset form when sleep is loaded
  useEffect(() => {
    if (sleep) {
      const sleepDate = sleep.date ? new Date(sleep.date).toISOString().split('T')[0] : undefined
      const bedtime = sleep.sleepBedtime ? new Date(sleep.sleepBedtime).toISOString().slice(0, 16) : undefined
      const wakeTime = sleep.sleepWakeTime ? new Date(sleep.sleepWakeTime).toISOString().slice(0, 16) : undefined
      
      reset({
        sleepHours: sleep.sleepHours,
        sleepQuality: sleep.sleepQuality ?? undefined,
        sleepBedtime: bedtime,
        sleepWakeTime: wakeTime,
        notes: sleep.notes || '',
        date: sleepDate,
      })
    }
  }, [sleep, reset])

  const mutation = useMutation({
    mutationFn: (data: CreateSleepDto | UpdateSleepDto) =>
      isEditing ? updateSleep(id!, data as UpdateSleepDto) : createSleep(data as CreateSleepDto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sleep'] })
      toast({
        title: isEditing ? t('sleep.sleepUpdated') : t('sleep.sleepCreated'),
        variant: 'success',
      })
      navigate('/app/measurements/sleep')
    },
    onError: (error: any) => {
      toast({
        title: isEditing ? t('sleep.errorUpdating') : t('sleep.errorCreating'),
        description: error.response?.data?.message || error.message,
        variant: 'error',
      })
    },
  })

  const onSubmit = async (data: Form) => {
    const payload: CreateSleepDto | UpdateSleepDto = {
      sleepHours: data.sleepHours,
      sleepQuality: data.sleepQuality === '' ? undefined : data.sleepQuality,
      sleepBedtime: data.sleepBedtime || undefined,
      sleepWakeTime: data.sleepWakeTime || undefined,
      notes: data.notes || undefined,
      date: data.date || undefined,
    }
    await mutation.mutateAsync(payload)
  }

  if (isEditing && loadingSleep) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="text-gray-400 text-sm">{t('common.loading')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 px-4 sm:px-0">
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold">
          {isEditing ? t('sleep.editSleep') : t('sleep.addSleep')}
        </h1>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Date */}
        <div className="w-full min-w-0">
          <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-2">
            {t('sleep.date')}
          </label>
          <input
            id="date"
            type="date"
            className="w-full min-w-0 px-4 py-3 bg-[#101010] border border-gray-800 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-primary transition"
            style={{ maxWidth: '100%', boxSizing: 'border-box' }}
            {...register('date')}
          />
          {errors.date && <p className="mt-1 text-sm text-red-500">{errors.date.message}</p>}
        </div>

        {/* Sleep Hours */}
        <div>
          <label htmlFor="sleepHours" className="block text-sm font-medium text-gray-300 mb-2">
            {t('sleep.sleepHours')} <span className="text-red-500">*</span>
          </label>
          <input
            id="sleepHours"
            type="number"
            step="0.1"
            min="0"
            max="24"
            autoFocus
            className="w-full px-4 py-3 bg-[#101010] border border-gray-800 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-primary transition"
            placeholder={t('sleep.sleepHoursPlaceholder')}
            {...register('sleepHours', { valueAsNumber: true })}
          />
          {errors.sleepHours && <p className="mt-1 text-sm text-red-500">{errors.sleepHours.message}</p>}
        </div>

        {/* Sleep Quality */}
        <div>
          <label htmlFor="sleepQuality" className="block text-sm font-medium text-gray-300 mb-2">
            {t('sleep.sleepQuality')}
          </label>
          <input
            id="sleepQuality"
            type="number"
            min="1"
            max="10"
            className="w-full px-4 py-3 bg-[#101010] border border-gray-800 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-primary transition"
            placeholder={t('sleep.sleepQualityPlaceholder')}
            {...register('sleepQuality', {
              setValueAs: (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
            })}
          />
          <p className="mt-1 text-xs text-gray-500">{t('sleep.sleepQualityHint')}</p>
          {errors.sleepQuality && <p className="mt-1 text-sm text-red-500">{errors.sleepQuality.message}</p>}
        </div>

        {/* Bedtime */}
        <div>
          <label htmlFor="sleepBedtime" className="block text-sm font-medium text-gray-300 mb-2">
            {t('sleep.bedtime')}
          </label>
          <input
            id="sleepBedtime"
            type="datetime-local"
            className="w-full px-4 py-3 bg-[#101010] border border-gray-800 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-primary transition"
            {...register('sleepBedtime')}
          />
          <p className="mt-1 text-xs text-gray-500">{t('sleep.bedtimeHint')}</p>
          {errors.sleepBedtime && <p className="mt-1 text-sm text-red-500">{errors.sleepBedtime.message}</p>}
        </div>

        {/* Wake Time */}
        <div>
          <label htmlFor="sleepWakeTime" className="block text-sm font-medium text-gray-300 mb-2">
            {t('sleep.wakeTime')}
          </label>
          <input
            id="sleepWakeTime"
            type="datetime-local"
            className="w-full px-4 py-3 bg-[#101010] border border-gray-800 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-primary transition"
            {...register('sleepWakeTime')}
          />
          <p className="mt-1 text-xs text-gray-500">{t('sleep.wakeTimeHint')}</p>
          {errors.sleepWakeTime && <p className="mt-1 text-sm text-red-500">{errors.sleepWakeTime.message}</p>}
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-2">
            {t('sleep.notes')}
          </label>
          <textarea
            id="notes"
            rows={3}
            className="w-full px-4 py-3 bg-[#101010] border border-gray-800 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-primary transition resize-none"
            placeholder={t('sleep.notesPlaceholder')}
            {...register('notes')}
          />
          {errors.notes && <p className="mt-1 text-sm text-red-500">{errors.notes.message}</p>}
        </div>

        {/* Submit Button */}
        <div className="sticky bottom-0 left-0 right-0 z-40 bg-dark pb-4 pt-4 border-t border-gray-800">
          <button
            type="submit"
            disabled={isSubmitting || mutation.isPending}
            className="w-full bg-primary text-black py-3 rounded-md font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting || mutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{t('common.saving')}</span>
              </>
            ) : (
              <span>{t('common.save')}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

