import { createPortal } from 'react-dom'
import { useMemo, useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useToast } from './ToastProvider'
import { useExercises, useInvalidateExercises, type Exercise } from '@/api/exercise'

type Props = {
  open: boolean
  onClose: () => void
  onSelect: (id: string) => void
  exercises: Exercise[]
}

export function ExercisePickerModal({
  open,
  onClose,
  onSelect,
  exercises,
}: Props) {
  const { toast } = useToast()
  const invalidateExercises = useInvalidateExercises()
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('ALL')
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newGroup, setNewGroup] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Use React Query for search when query length >= 2 or group is selected
  const shouldSearchBackend = query.trim().length >= 2 || (group !== 'ALL' && query.trim().length === 0)
  const { data: searchData, isLoading: searching } = useExercises(
    shouldSearchBackend
      ? {
          page: 1,
          limit: 100,
          ...(query.trim().length >= 2 && { search: query.trim() }),
          ...(group !== 'ALL' && { muscleGroup: group }),
        }
      : undefined
  )
  const searchResults = searchData?.data ?? []

  // Limpar query quando o modal fecha
  useEffect(() => {
    if (!open) {
      setQuery('')
    }
  }, [open])

  const groups = useMemo(() => {
    const all = exercises.map(e => e.muscleGroup).filter(Boolean) as string[]
    return ['ALL', ...Array.from(new Set(all))]
  }, [exercises])

  // Determinar se deve usar resultados do backend ou busca local
  const shouldUseBackendResults = useMemo(() => {
    const q = query.trim()
    return q.length >= 2 || (group !== 'ALL' && q.length === 0)
  }, [query, group])

  // Usar resultados da busca se houver query ou grupo selecionado, senão usar busca local
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const source = shouldUseBackendResults ? searchResults : exercises
    
    return source.filter(e => {
      const matchGroup = group === 'ALL' || e.muscleGroup === group
      // Se já veio da busca do backend, não precisa filtrar por query novamente
      const matchQuery = shouldUseBackendResults ? true : (
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.muscleGroup?.toLowerCase().includes(q)
      )
      return matchGroup && matchQuery
    })
  }, [query, group, exercises, searchResults, shouldUseBackendResults])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-dark border border-gray-700 rounded-lg shadow-xl w-full max-w-lg h-[85vh] sm:h-auto sm:max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-3 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-gray-100">
            {creating ? 'Create Exercise' : 'Select Exercise'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {creating ? (
          <>
            <div className="p-4 space-y-3">
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Exercise name"
                className="w-full p-2 rounded bg-dark border border-gray-700 text-gray-200 text-base"
              />
              <select
                value={newGroup}
                onChange={e => setNewGroup(e.target.value)}
                className="w-full p-2 rounded bg-dark border border-gray-700 text-gray-200 text-sm"
              >
                <option value="">Select muscle group</option>
                {groups
                  .filter(g => g !== 'ALL')
                  .map(g => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 p-3 border-t border-gray-700">
              <button
                onClick={() => setCreating(false)}
                className="px-4 py-2 rounded border border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                disabled={loading || !newName.trim()}
                onClick={async () => {
                  try {
                    setLoading(true)
                    const payload = {
                      name: newName.trim(),
                      muscleGroup: newGroup || undefined,
                    }
                    const { data } = await api.post('/exercises', payload)
                    toast({
                      variant: 'success',
                      title: 'Exercise created',
                      description: `${data.name} was added successfully.`,
                    })
                    invalidateExercises()
                    onSelect(data.id)
                    onClose()
                  } catch (err: any) {
                    toast({
                      variant: 'error',
                      title: 'Failed to create exercise',
                      description: err?.message ?? 'Try again later.',
                    })
                  } finally {
                    setLoading(false)
                    setCreating(false)
                    setNewName('')
                    setNewGroup('')
                  }
                }}
                className={`px-4 py-2 rounded bg-primary text-black font-semibold ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Filters */}
            <div className="p-3 border-b border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {groups.map(g => (
                    <button
                      key={g}
                      onClick={() => setGroup(g)}
                      className={`px-3 py-1 rounded-full text-xs border whitespace-nowrap ${
                        group === g
                          ? 'bg-primary text-black border-primary'
                          : 'border-gray-600 text-gray-400 hover:border-gray-400'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCreating(true)}
                  className="text-xs border border-gray-600 px-2 py-1 rounded hover:bg-gray-800"
                >
                  + New
                </button>
              </div>

              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search exercise..."
                className="w-full p-2 rounded bg-dark border border-gray-700 text-gray-200 text-base"
              />
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {searching && (
                <p className="text-center text-gray-500 text-sm mt-10">
                  Searching...
                </p>
              )}
              {!searching && filtered.length === 0 && query.trim().length >= 2 && (
                <p className="text-center text-gray-500 text-sm mt-10">
                  No exercises found matching your search.
                </p>
              )}
              {!searching && filtered.length === 0 && query.trim().length < 2 && (
                <p className="text-center text-gray-500 text-sm mt-10">
                  No exercises found.
                </p>
              )}
              {filtered.map(e => (
                <div
                  key={e.id}
                  onClick={() => {
                    onSelect(e.id)
                    onClose()
                  }}
                  className="border border-gray-700 rounded px-3 py-2 hover:bg-gray-800 cursor-pointer"
                >
                  <div className="font-medium text-gray-100">{e.name}</div>
                  {e.muscleGroup && (
                    <div className="text-xs text-gray-500 uppercase">
                      {e.muscleGroup}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
