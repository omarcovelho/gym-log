import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Home, Dumbbell, FileText, History, Plus, X, Zap, AlertCircle } from 'lucide-react'
import { startManualWorkout, startWorkout, getActiveWorkout } from '@/api/workoutSession'
import { listWorkoutTemplates } from '@/api/workoutTemplates'
import { useToast } from './ToastProvider'

export function BottomNavigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [showActiveDialog, setShowActiveDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedOption, setSelectedOption] = useState<'free' | 'template' | null>(null)

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
      const session = await startManualWorkout()
      toast({
        title: 'Treino iniciado!',
        description: 'Bom treino! 💪',
        variant: 'success',
      })
      navigate(`/app/workouts/${session.id}`)
      setOpen(false)
      refetchActive()
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
      refetchActive()
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

  const isActive = (path: string) => {
    if (path === '/app') {
      return location.pathname === '/app' || location.pathname === '/app/'
    }
    const pathMatch = location.pathname === path || location.pathname.startsWith(path + '/')
    return pathMatch
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f0f0f]/95 backdrop-blur-md border-t border-gray-800 md:hidden">
        <div className="max-w-5xl mx-auto flex items-center justify-around px-2 py-2">
          {/* Home */}
          <Link
            to="/app"
            className={`
              flex flex-col items-center justify-center gap-1
              px-3 py-2 rounded-lg transition
              ${isActive('/app') 
                ? 'text-primary' 
                : 'text-gray-400 hover:text-gray-200'
              }
            `}
            aria-label="Home"
          >
            <Home className={`w-6 h-6 ${isActive('/app') ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] font-medium">Home</span>
          </Link>

          {/* Exercises */}
          <Link
            to="/app/exercises"
            className={`
              flex flex-col items-center justify-center gap-1
              px-3 py-2 rounded-lg transition
              ${isActive('/app/exercises') 
                ? 'text-primary' 
                : 'text-gray-400 hover:text-gray-200'
              }
            `}
            aria-label="Exercises"
          >
            <Dumbbell className={`w-6 h-6 ${isActive('/app/exercises') ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] font-medium">Exercises</span>
          </Link>

          {/* Botão de Iniciar Treino (centro destacado) */}
          <div className="flex flex-col items-center">
            <button
              onClick={handleButtonClick}
              className="w-12 h-12 -mt-2 bg-primary text-dark rounded-full shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
              aria-label="Iniciar treino"
              title="Iniciar Treino"
            >
              <Plus className="w-6 h-6" strokeWidth={2.5} />
            </button>
            <span className="text-[10px] font-medium text-primary mt-1">Treino</span>
          </div>

          {/* Templates */}
          <Link
            to="/app/templates"
            className={`
              flex flex-col items-center justify-center gap-1
              px-3 py-2 rounded-lg transition
              ${isActive('/app/templates') 
                ? 'text-primary' 
                : 'text-gray-400 hover:text-gray-200'
              }
            `}
            aria-label="Templates"
          >
            <FileText className={`w-6 h-6 ${isActive('/app/templates') ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] font-medium">Templates</span>
          </Link>

          {/* Workouts */}
          <Link
            to="/app/workouts"
            className={`
              flex flex-col items-center justify-center gap-1
              px-3 py-2 rounded-lg transition
              ${isActive('/app/workouts') 
                ? 'text-primary' 
                : 'text-gray-400 hover:text-gray-200'
              }
            `}
            aria-label="Workouts"
          >
            <History className={`w-6 h-6 ${isActive('/app/workouts') ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] font-medium">Workouts</span>
          </Link>
        </div>
      </nav>

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
                  <h2 className="text-xl font-semibold text-gray-100">Treino em Andamento</h2>
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
                  <div className="text-sm text-gray-400 mb-1">Treino atual:</div>
                  <div className="font-semibold text-gray-100">
                    {activeWorkout.title || 'Treino Livre'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Iniciado em {new Date(activeWorkout.startAt).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                <p className="text-sm text-gray-400">
                  Você já tem um treino em andamento. Deseja continuar este treino ou iniciar um novo?
                </p>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleContinueActive}
                    className="flex-1 px-4 py-2 bg-primary text-dark font-semibold rounded-lg hover:brightness-110 transition"
                  >
                    Continuar Treino
                  </button>
                  <button
                    onClick={handleStartNew}
                    className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition"
                  >
                    Iniciar Novo
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
                <h2 className="text-xl font-semibold text-gray-100">Iniciar Treino</h2>
                <button
                  onClick={() => {
                    setOpen(false)
                    setSelectedOption(null)
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
                      onClick={() => setSelectedOption('free')}
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
                      onClick={() => setSelectedOption('template')}
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
                      <p className="text-sm text-gray-400">
                        Você começará com um treino vazio e poderá adicionar exercícios conforme
                        necessário.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setSelectedOption(null)}
                        className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition"
                      >
                        Voltar
                      </button>
                      <button
                        onClick={handleStartFree}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-primary text-dark font-semibold rounded-lg hover:brightness-110 transition disabled:opacity-50"
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

