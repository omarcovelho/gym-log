import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { X, Plus, FileText, Zap, AlertCircle } from 'lucide-react'
import { startManualWorkout, startWorkout, getActiveWorkout } from '@/api/workoutSession'
import { listWorkoutTemplates } from '@/api/workoutTemplates'
import { useToast } from './ToastProvider'

export function FloatingActionButton() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [showActiveDialog, setShowActiveDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedOption, setSelectedOption] = useState<'free' | 'template' | null>(null)
  const [workoutTitle, setWorkoutTitle] = useState('')

  // Buscar treino ativo
  const { data: activeWorkout, refetch: refetchActive } = useQuery({
    queryKey: ['active-workout'],
    queryFn: getActiveWorkout,
  })

  // Buscar templates quando modal abrir
  const { data: templatesData, isLoading: loadingTemplates } = useQuery({
    queryKey: ['workout-templates'],
    queryFn: () => listWorkoutTemplates(1, 20),
    enabled: open && selectedOption === 'template',
  })

  const handleStartFree = async () => {
    try {
      setLoading(true)
      const session = await startManualWorkout(workoutTitle.trim())
      toast({
        title: t('workout.workoutStarted'),
        description: t('workout.workoutStartedDescription'),
        variant: 'success',
      })
      navigate(`/app/workouts/${session.id}`)
      setOpen(false)
      refetchActive()
    } catch (error) {
      console.error('Error starting workout:', error)
      toast({
        title: t('workout.errorStarting'),
        description: t('workout.errorStartingDescription'),
        variant: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStartFromTemplate = async (templateId: string) => {
    try {
      setLoading(true)
      const session = await startWorkout(templateId)
      toast({
        title: t('workout.workoutStarted'),
        description: t('workout.workoutStartedDescription'),
        variant: 'success',
      })
      navigate(`/app/workouts/${session.id}`)
      setOpen(false)
      refetchActive()
    } catch (error) {
      console.error('Error starting workout:', error)
      toast({
        title: t('workout.errorStarting'),
        description: t('workout.errorStartingDescription'),
        variant: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleButtonClick = async () => {
    // Verificar se há treino ativo
    const active = await refetchActive()
    if (active.data) {
      setShowActiveDialog(true)
    } else {
      setOpen(true)
    }
  }

  const handleContinueActive = () => {
    if (activeWorkout) {
      navigate(`/app/workouts/${activeWorkout.id}`)
      setShowActiveDialog(false)
    }
  }

  const handleStartNew = () => {
    setShowActiveDialog(false)
    setOpen(true)
  }

  return (
    <>
      {/* FAB Button - Fixo na parte inferior (apenas desktop) */}
      <div className="fixed bottom-6 right-6 z-40 group hidden md:block">
        {/* Tooltip/Label - Visível no hover (desktop) */}
        <div className="hidden md:block absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-gray-900 text-gray-100 text-sm font-medium px-3 py-2 rounded-lg whitespace-nowrap shadow-lg border border-gray-700">
            {t('workout.startWorkout')}
            <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
          </div>
        </div>
        
        {/* Botão */}
        <button
          onClick={handleButtonClick}
          className="w-16 h-16 bg-primary text-dark rounded-full shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
          aria-label={t('workout.startWorkout')}
          title={t('workout.startWorkout')}
        >
          <Plus className="w-7 h-7" strokeWidth={2.5} />
        </button>
      </div>

      {/* Diálogo de treino ativo */}
      {showActiveDialog && activeWorkout &&
        createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
            <div className="bg-[#181818] border border-gray-800 rounded-xl w-full max-w-md shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/10 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-100">{t('workout.activeWorkout')}</h2>
                </div>
                <button
                  onClick={() => setShowActiveDialog(false)}
                  className="text-gray-400 hover:text-gray-200 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="p-4 rounded-lg border border-gray-800 bg-[#101010]">
                  <div className="text-sm text-gray-400 mb-1">{t('workout.currentWorkoutLabel')}</div>
                  <div className="font-semibold text-gray-100">
                    {activeWorkout.title || t('workout.freeWorkoutLabel')}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {t('workout.startedAt')} {new Date(activeWorkout.startAt).toLocaleString(i18n.language === 'pt' ? 'pt-BR' : 'en-US', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                <p className="text-sm text-gray-400">
                  {t('workout.activeWorkoutMessage')}
                </p>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleContinueActive}
                    className="flex-1 px-4 py-2 bg-primary text-dark font-semibold rounded-lg hover:brightness-110 transition"
                  >
                    {t('workout.continueWorkout')}
                  </button>
                  <button
                    onClick={handleStartNew}
                    className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition"
                  >
                    {t('workout.startNew')}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Modal */}
      {open &&
        createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
            <div className="bg-[#181818] border border-gray-800 rounded-xl w-full max-w-md shadow-xl max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <h2 className="text-xl font-semibold text-gray-100">{t('workout.startWorkout')}</h2>
                <button
                  onClick={() => {
                    setOpen(false)
                    setSelectedOption(null)
                    setWorkoutTitle('')
                  }}
                  className="text-gray-400 hover:text-gray-200 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 flex-1 overflow-y-auto">
                {selectedOption === null ? (
                  /* Escolher tipo de treino */
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        setSelectedOption('free')
                        setWorkoutTitle('')
                      }}
                      className="w-full p-4 rounded-lg border-2 border-gray-700 hover:border-primary bg-[#101010] text-left transition group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition">
                          <Zap className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-100">{t('workout.freeWorkout')}</div>
                          <div className="text-sm text-gray-400">
                            {t('workout.freeWorkoutDescription')}
                          </div>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedOption('template')
                        setWorkoutTitle('')
                      }}
                      className="w-full p-4 rounded-lg border-2 border-gray-700 hover:border-primary bg-[#101010] text-left transition group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-100">{t('workout.useTemplate')}</div>
                          <div className="text-sm text-gray-400">
                            {t('workout.templateDescription')}
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                ) : selectedOption === 'free' ? (
                  /* Confirmar treino livre */
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg border border-gray-800 bg-[#101010]">
                      <div className="flex items-center gap-3 mb-2">
                        <Zap className="w-5 h-5 text-primary" />
                        <div className="font-semibold text-gray-100">{t('workout.freeWorkout')}</div>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">
                        {t('workout.emptyWorkoutDescription')}
                      </p>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1.5">
                          {t('workout.workoutTitle', 'Nome do treino')}
                        </label>
                        <input
                          type="text"
                          value={workoutTitle}
                          onChange={(e) => setWorkoutTitle(e.target.value)}
                          placeholder={t('workout.workoutNamePlaceholder', 'Digite o nome do treino')}
                          className="w-full rounded-md border border-gray-700 bg-[#0f0f0f] px-3 py-2 text-base text-gray-100 placeholder:text-gray-500 focus:border-primary focus:outline-none transition"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setSelectedOption(null)
                          setWorkoutTitle('')
                        }}
                        className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition"
                      >
                        {t('common.back')}
                      </button>
                      <button
                        onClick={handleStartFree}
                        disabled={loading || workoutTitle.trim() === ''}
                        className="flex-1 px-4 py-2 bg-primary text-dark font-semibold rounded-lg hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? t('workout.starting') : t('workout.startFreeWorkout')}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Escolher template */
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <button
                        onClick={() => setSelectedOption(null)}
                        className="text-gray-400 hover:text-gray-200 transition"
                      >
                        ← {t('common.back')}
                      </button>
                      <div className="font-semibold text-gray-100">{t('workout.chooseTemplate')}</div>
                    </div>

                    {loadingTemplates ? (
                      <div className="text-center py-8">
                        <div className="text-gray-400">{t('workout.loadingTemplates')}</div>
                      </div>
                    ) : !templatesData?.data || templatesData.data.length === 0 ? (
                      <div className="text-center py-8 space-y-3">
                        <FileText className="w-12 h-12 text-gray-600 mx-auto" />
                        <div className="text-gray-400">{t('workout.noTemplates')}</div>
                        <p className="text-sm text-gray-500">
                          {t('workout.createTemplateFirst')}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {templatesData.data.map((template) => (
                          <button
                            key={template.id}
                            onClick={() => handleStartFromTemplate(template.id)}
                            disabled={loading}
                            className="w-full p-3 rounded-lg border border-gray-800 hover:border-primary bg-[#101010] text-left transition disabled:opacity-50"
                          >
                            <div className="font-medium text-gray-100">{template.title}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              {template.items.length} {template.items.length === 1 ? t('workout.exercisesCount') : t('workout.exercisesCountPlural')}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}

