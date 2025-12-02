import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams, Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listSleeps, deleteSleep, type Sleep } from '@/api/sleep'
import { useAuth } from '@/auth/AuthContext'
import { useToast } from '@/components/ToastProvider'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Pagination } from '@/components/Pagination'
import { ProgressRangeFilter } from '@/components/ProgressRangeFilter'
import { SleepCharts } from '@/components/SleepCharts'
import type { RangePreset } from '@/utils/dateRange'
import { calculateDateRange } from '@/utils/dateRange'

export default function SleepList() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedRange, setSelectedRange] = useState<RangePreset>('4weeks')

  const currentPage = parseInt(searchParams.get('page') || '1', 10)
  const currentLimit = parseInt(searchParams.get('limit') || '10', 10)

  // Calcular dates do range selecionado
  const dateRange = useMemo(() => calculateDateRange(selectedRange), [selectedRange])

  const isBodyMeasurementsActive = location.pathname === '/app/measurements' || (location.pathname.startsWith('/app/measurements/') && !location.pathname.includes('/sleep'))
  const isSleepActive = location.pathname.startsWith('/app/measurements/sleep')

  const { data, isLoading, error } = useQuery({
    queryKey: ['sleep', currentPage, currentLimit],
    queryFn: () => listSleeps(currentPage, currentLimit),
    enabled: !!user && isSleepActive,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSleep,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sleep'] })
      toast({
        variant: 'success',
        title: t('sleep.sleepDeleted'),
      })
      setConfirmId(null)
    },
    onError: (error: any) => {
      toast({
        variant: 'error',
        title: t('sleep.errorDeleting'),
        description: error.response?.data?.message || error.message,
      })
    },
  })

  function handlePageChange(page: number) {
    setSearchParams({ page: page.toString(), limit: currentLimit.toString() })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deleteMutation.mutateAsync(id)
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString(i18n.language === 'pt' ? 'pt-BR' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatTime = (dateString: string | null): string => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleTimeString(i18n.language === 'pt' ? 'pt-BR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading && isSleepActive) {
    return <p className="text-gray-400 text-center mt-8">{t('common.loading')}</p>
  }

  if (error && isSleepActive) {
    return (
      <div className="text-center mt-8">
        <p className="text-gray-400">{t('sleep.errorLoading')}</p>
      </div>
    )
  }

  const sleeps = data?.data || []
  const pagination = data?.meta

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">{t('diary.title', 'Diário')}</h1>
        <p className="text-gray-400 text-sm md:text-base">{t('diary.subtitle', 'Acompanhe suas medidas corporais e sono')}</p>
      </div>

      {/* Tabs de Navegação */}
      <div className="flex rounded-lg border border-gray-800 bg-[#151515] p-1">
        <Link
          to="/app/measurements"
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition text-center ${
            isBodyMeasurementsActive
              ? 'bg-primary text-black'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          {t('diary.bodyMeasurements', 'Medidas Corporais')}
        </Link>
        <Link
          to="/app/measurements/sleep"
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition text-center ${
            isSleepActive
              ? 'bg-primary text-black'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          {t('diary.sleep', 'Sono')}
        </Link>
      </div>

      {/* Filtro de Range */}
      <ProgressRangeFilter value={selectedRange} onChange={setSelectedRange} />

      {/* Gráfico */}
      <div className="rounded-xl border border-gray-800 bg-[#101010] p-4 md:p-6">
        <SleepCharts
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
        />
      </div>

      {/* Header com botão de adicionar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-100">{t('sleep.history')}</h2>
          <p className="text-sm text-gray-400 mt-1">{t('sleep.historyDescription')}</p>
        </div>

        <Link
          to="/app/measurements/sleep/new"
          className="
            w-full sm:w-auto
            px-4 py-2
            bg-primary
            text-black
            rounded-lg
            font-semibold
            text-sm
            shadow-md
            hover:brightness-110
            transition
            text-center
            flex items-center justify-center gap-2
          "
        >
          <Plus className="w-4 h-4" />
          <span>{t('sleep.addSleep')}</span>
        </Link>
      </div>

      {sleeps.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <div className="text-gray-500 text-lg">{t('sleep.noSleeps')}</div>
          <p className="text-gray-500 text-sm">{t('sleep.noSleepsDescription')}</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {sleeps.map((sleep: Sleep) => (
              <div
                key={sleep.id}
                className="bg-[#181818] rounded-xl p-5 border border-gray-800 shadow-sm transition-all duration-200 ease-in-out hover:shadow-lg hover:-translate-y-0.5 hover:border-gray-700"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="font-semibold text-lg text-gray-100">
                        {formatDate(sleep.date)}
                      </h2>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-primary">{sleep.sleepHours}</span>
                        <span className="text-sm text-gray-400">{t('sleep.hours')}</span>
                      </div>

                      <div className="flex flex-col gap-2 text-sm text-gray-400 mt-2">
                        {sleep.sleepQuality && (
                          <div>
                            <span className="text-gray-500">{t('sleep.sleepQuality')}: </span>
                            <span className="text-gray-300">{sleep.sleepQuality}/10</span>
                          </div>
                        )}
                        {sleep.sleepBedtime && (
                          <div>
                            <span className="text-gray-500">{t('sleep.bedtime')}: </span>
                            <span className="text-gray-300">{formatTime(sleep.sleepBedtime)}</span>
                          </div>
                        )}
                        {sleep.sleepWakeTime && (
                          <div>
                            <span className="text-gray-500">{t('sleep.wakeTime')}: </span>
                            <span className="text-gray-300">{formatTime(sleep.sleepWakeTime)}</span>
                          </div>
                        )}
                      </div>

                      {sleep.notes && (
                        <p className="text-sm text-gray-400 italic mt-2">"{sleep.notes}"</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => navigate(`/app/measurements/sleep/${sleep.id}/edit`)}
                      className="p-2 rounded-md bg-[#101010] text-gray-400 hover:text-gray-200 border border-gray-800 transition"
                      aria-label="Edit sleep"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setConfirmId(sleep.id)}
                      disabled={deletingId === sleep.id}
                      className={`
                        p-2 rounded-md border transition
                        ${
                          deletingId === sleep.id
                            ? 'opacity-50 cursor-not-allowed bg-[#101010] text-gray-500 border-gray-800'
                            : 'bg-[#101010] text-gray-400 hover:text-gray-200 border-gray-800'
                        }
                      `}
                      aria-label="Delete sleep"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <ConfirmDialog
                  open={confirmId === sleep.id}
                  title={t('sleep.deleteSleep')}
                  message={t('sleep.deleteSleepMessage')}
                  confirmText={t('common.delete')}
                  cancelText={t('common.cancel')}
                  onConfirm={() => handleDelete(sleep.id)}
                  onCancel={() => setConfirmId(null)}
                />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <Pagination meta={pagination} onPageChange={handlePageChange} />
          )}
        </>
      )}
    </div>
  )
}

