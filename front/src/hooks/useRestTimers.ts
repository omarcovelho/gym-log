import { useState, useEffect, useCallback } from 'react'
import { getRestTimers, type RestTimer } from '@/api/restTimer'

// Cache global compartilhado entre componentes
let cachedTimers: RestTimer[] | null = null
let cacheTimestamp: number = 0
let loadingPromise: Promise<RestTimer[]> | null = null // Evitar requisições simultâneas
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

// Sistema de notificação para componentes quando cache é atualizado
type Listener = () => void
const listeners = new Set<Listener>()

function notifyListeners() {
  listeners.forEach((listener) => listener())
}

export function useRestTimers(forceRefresh = false) {
  const [timers, setTimers] = useState<RestTimer[]>(cachedTimers || [])
  const [loading, setLoading] = useState(false)
  const [, forceUpdate] = useState({})

  // Registrar listener para atualizar quando cache mudar
  useEffect(() => {
    const listener = () => {
      if (cachedTimers) {
        setTimers(cachedTimers)
      }
      forceUpdate({})
    }
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  const loadTimers = useCallback(async (skipCache = false) => {
    const now = Date.now()
    const isCacheValid = cachedTimers && (now - cacheTimestamp) < CACHE_DURATION

    // Se o cache é válido e não foi solicitado refresh, usar cache
    if (isCacheValid && !skipCache && !forceRefresh) {
      setTimers(cachedTimers)
      return cachedTimers
    }

    // Se já há uma requisição em andamento, aguardar ela ao invés de criar nova
    if (loadingPromise) {
      try {
        const data = await loadingPromise
        setTimers(data)
        return data
      } catch (err) {
        // Se a requisição anterior falhou e temos cache, usar cache
        if (cachedTimers) {
          setTimers(cachedTimers)
          return cachedTimers
        }
        // Se não há cache, deixar o erro propagar
        throw err
      }
    }

    // Criar nova requisição apenas se não houver uma em andamento
    setLoading(true)
    loadingPromise = getRestTimers()
      .then((data) => {
        cachedTimers = data
        cacheTimestamp = Date.now()
        notifyListeners() // Notificar todos os componentes
        return data
      })
      .finally(() => {
        loadingPromise = null
      })

    try {
      const data = await loadingPromise
      setTimers(data)
      return data
    } catch (err) {
      console.error('Failed to load timers:', err)
      // Se houver erro mas tiver cache, manter o cache
      if (cachedTimers) {
        setTimers(cachedTimers)
        return cachedTimers
      }
      throw err
    } finally {
      setLoading(false)
    }
  }, [forceRefresh])

  // Carregar apenas se não houver cache
  useEffect(() => {
    // Se já há cache válido, apenas atualizar o estado
    if (cachedTimers) {
      const now = Date.now()
      const isCacheValid = (now - cacheTimestamp) < CACHE_DURATION
      
      if (isCacheValid && !forceRefresh) {
        setTimers(cachedTimers)
        return
      }
    }

    // Se não há cache ou foi solicitado refresh, carregar
    // Mas apenas se não houver uma requisição já em andamento
    if (!loadingPromise) {
      loadTimers(forceRefresh)
    } else {
      // Se há requisição em andamento, aguardar ela
      loadingPromise.then((data) => {
        setTimers(data)
      }).catch(() => {
        if (cachedTimers) {
          setTimers(cachedTimers)
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Função para invalidar o cache (chamada quando timers são criados/atualizados/deletados)
  const invalidateCache = useCallback(() => {
    cachedTimers = null
    cacheTimestamp = 0
    loadingPromise = null
    // Notificar componentes para recarregar
    notifyListeners()
  }, [])

  return {
    timers,
    loading,
    loadTimers,
    invalidateCache,
  }
}

