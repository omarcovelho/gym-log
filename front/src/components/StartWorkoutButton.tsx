import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { X, Plus, FileText, Zap } from 'lucide-react'
import { startManualWorkout, startWorkout } from '@/api/workoutSession'
import { listWorkoutTemplates } from '@/api/workoutTemplates'
import { useToast } from './ToastProvider'

type Props = {
  variant?: 'default' | 'large'
  className?: string
}

export function StartWorkoutButton({ variant = 'default', className = '' }: Props) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedOption, setSelectedOption] = useState<'free' | 'template' | null>(null)
  const [workoutTitle, setWorkoutTitle] = useState('')

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
        title: 'Treino iniciado!',
        description: 'Bom treino! 💪',
        variant: 'success',
      })
      navigate(`/app/workouts/${session.id}`)
      setOpen(false)
    } catch (error) {
      console.error('Error starting workout:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar o treino',
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
        title: 'Treino iniciado!',
        description: 'Bom treino! 💪',
        variant: 'success',
      })
      navigate(`/app/workouts/${session.id}`)
      setOpen(false)
    } catch (error) {
      console.error('Error starting workout:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar o treino',
        variant: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const buttonClass =
    variant === 'large'
      ? 'w-full px-6 py-4 bg-primary text-dark font-bold text-lg rounded-xl hover:brightness-110 transition disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-primary/20'
      : 'px-4 py-2 bg-primary text-dark font-semibold rounded-lg hover:brightness-110 transition disabled:opacity-50 flex items-center justify-center gap-2'

  return (
    <>
      <button onClick={() => setOpen(true)} className={buttonClass + ' ' + className}>
        <Plus className={variant === 'large' ? 'w-6 h-6' : 'w-5 h-5'} />
        Iniciar Treino
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
            <div className="bg-[#181818] border border-gray-800 rounded-xl w-full max-w-md shadow-xl max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <h2 className="text-xl font-semibold text-gray-100">Iniciar Treino</h2>
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
                          <div className="font-semibold text-gray-100">Treino Livre</div>
                          <div className="text-sm text-gray-400">
                            Comece do zero e adicione exercícios conforme treina
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
                          <div className="font-semibold text-gray-100">Usar Template</div>
                          <div className="text-sm text-gray-400">
                            Escolha um template salvo para começar
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
                        <div className="font-semibold text-gray-100">Treino Livre</div>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">
                        Você começará com um treino vazio e poderá adicionar exercícios conforme
                        necessário.
                      </p>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1.5">
                          Nome do treino
                        </label>
                        <input
                          type="text"
                          value={workoutTitle}
                          onChange={(e) => setWorkoutTitle(e.target.value)}
                          placeholder="Digite o nome do treino"
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
                        Voltar
                      </button>
                      <button
                        onClick={handleStartFree}
                        disabled={loading || workoutTitle.trim() === ''}
                        className="flex-1 px-4 py-2 bg-primary text-dark font-semibold rounded-lg hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Iniciando...' : 'Iniciar Treino Livre'}
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
                        ← Voltar
                      </button>
                      <div className="font-semibold text-gray-100">Escolher Template</div>
                    </div>

                    {loadingTemplates ? (
                      <div className="text-center py-8">
                        <div className="text-gray-400">Carregando templates...</div>
                      </div>
                    ) : !templatesData?.data || templatesData.data.length === 0 ? (
                      <div className="text-center py-8 space-y-3">
                        <FileText className="w-12 h-12 text-gray-600 mx-auto" />
                        <div className="text-gray-400">Nenhum template encontrado</div>
                        <p className="text-sm text-gray-500">
                          Crie um template primeiro para usar esta opção
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
                              {template.items.length} exercício{template.items.length !== 1 ? 's' : ''}
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

