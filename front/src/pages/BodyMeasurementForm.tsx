import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createBodyMeasurement,
  updateBodyMeasurement,
  getBodyMeasurement,
  type CreateBodyMeasurementDto,
  type UpdateBodyMeasurementDto,
} from '@/api/bodyMeasurement'
import { useToast } from '@/components/ToastProvider'

export default function BodyMeasurementForm() {
  const { t } = useTranslation()
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const getSchema = () =>
    z.object({
      weight: z.number().min(0, t('validation.weightMin')).max(500, t('validation.weightMax')),
      waist: z.preprocess(
        (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
        z.number().min(0).max(300).optional(),
      ),
      arm: z.preprocess(
        (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
        z.number().min(0).max(200).optional(),
      ),
      notes: z.string().optional(),
      date: z.string().optional(),
    })

  type Form = z.infer<ReturnType<typeof getSchema>>

  // Load measurement for editing
  const { data: measurement, isLoading: loadingMeasurement } = useQuery({
    queryKey: ['body-measurement', id],
    queryFn: () => getBodyMeasurement(id!),
    enabled: isEditing && !!id,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setFocus,
  } = useForm<Form>({
    resolver: zodResolver(getSchema()),
    defaultValues: {
      weight: undefined,
      waist: undefined,
      arm: undefined,
      notes: '',
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
    },
  })

  // Reset form when measurement is loaded
  useEffect(() => {
    if (measurement) {
      reset({
        weight: measurement.weight,
        waist: measurement.waist ?? undefined,
        arm: measurement.arm ?? undefined,
        notes: measurement.notes ?? '',
        date: new Date(measurement.date).toISOString().split('T')[0],
      })
    }
  }, [measurement, reset])

  // Auto-focus on weight field when creating new
  useEffect(() => {
    if (!isEditing) {
      setTimeout(() => setFocus('weight'), 100)
    }
  }, [isEditing, setFocus])

  const mutation = useMutation({
    mutationFn: async (data: Form) => {
      const dto: CreateBodyMeasurementDto | UpdateBodyMeasurementDto = {
        weight: data.weight,
        waist: data.waist,
        arm: data.arm,
        notes: data.notes || undefined,
        date: data.date || undefined,
      }

      if (isEditing) {
        return updateBodyMeasurement(id!, dto)
      } else {
        return createBodyMeasurement(dto as CreateBodyMeasurementDto)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['body-measurements'] })
      toast({
        variant: 'success',
        title: t('measurements.measurementSaved'),
      })
      navigate('/app/measurements')
    },
    onError: (error: any) => {
      toast({
        variant: 'error',
        title: t('measurements.errorSaving'),
        description: error.response?.data?.message || error.message,
      })
    },
  })

  const onSubmit = async (data: Form) => {
    await mutation.mutateAsync(data)
  }

  if (loadingMeasurement) {
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
          {isEditing ? t('measurements.editMeasurement') : t('measurements.addMeasurement')}
        </h1>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Date */}
        <div className="w-full min-w-0">
          <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-2">
            {t('measurements.date')}
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

        {/* Weight */}
        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-gray-300 mb-2">
            {t('measurements.weight')} <span className="text-red-500">*</span>
          </label>
          <input
            id="weight"
            type="number"
            step="0.1"
            autoFocus
            className="w-full px-4 py-3 bg-[#101010] border border-gray-800 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-primary transition"
            placeholder={t('measurements.weightPlaceholder')}
            {...register('weight', { valueAsNumber: true })}
          />
          {errors.weight && <p className="mt-1 text-sm text-red-500">{errors.weight.message}</p>}
        </div>

        {/* Waist */}
        <div>
          <label htmlFor="waist" className="block text-sm font-medium text-gray-300 mb-2">
            {t('measurements.waist')}
          </label>
          <input
            id="waist"
            type="number"
            step="0.1"
            className="w-full px-4 py-3 bg-[#101010] border border-gray-800 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-primary transition"
            placeholder={t('measurements.waistPlaceholder')}
            {...register('waist', {
              setValueAs: (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
            })}
          />
          {errors.waist && <p className="mt-1 text-sm text-red-500">{errors.waist.message}</p>}
        </div>

        {/* Arm */}
        <div>
          <label htmlFor="arm" className="block text-sm font-medium text-gray-300 mb-2">
            {t('measurements.arm')}
          </label>
          <input
            id="arm"
            type="number"
            step="0.1"
            className="w-full px-4 py-3 bg-[#101010] border border-gray-800 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-primary transition"
            placeholder={t('measurements.armPlaceholder')}
            {...register('arm', {
              setValueAs: (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
            })}
          />
          {errors.arm && <p className="mt-1 text-sm text-red-500">{errors.arm.message}</p>}
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-2">
            {t('measurements.notes')}
          </label>
          <textarea
            id="notes"
            rows={3}
            className="w-full px-4 py-3 bg-[#101010] border border-gray-800 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-primary transition resize-none"
            placeholder={t('measurements.notesPlaceholder')}
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

