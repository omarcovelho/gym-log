import { createContext, useContext, useMemo, useState, useEffect } from 'react'
import { validateToken, isTokenExpired } from '@/api/auth'

export type User = { sub: string; email: string; name?: string; height?: number; weight?: number; role?: string } | null
type AuthCtx = {
  user: User
  loading: boolean
  login: (token: string, payload: User) => void
  logout: () => void
}

const Ctx = createContext<AuthCtx>({} as any)

const AUTH_INIT_TIMEOUT_MS = 15000

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('Auth initialization timed out')), ms)
    }),
  ])
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function initializeAuth() {
      const token = localStorage.getItem('access_token')
      const payload = localStorage.getItem('user_payload')

      if (!token || !payload) {
        setLoading(false)
        return
      }

      if (isTokenExpired(token)) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_payload')
        setLoading(false)
        return
      }

      try {
        const response = await withTimeout(validateToken(), AUTH_INIT_TIMEOUT_MS)
        const parsedPayload = JSON.parse(payload)

        setUser({
          sub: response.user.id,
          email: response.user.email,
          name: response.user.name || parsedPayload.name,
          role: response.user.role || parsedPayload.role,
        })
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_payload')
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      loading,
      login: (token, payload) => {
        localStorage.setItem('access_token', token)
        localStorage.setItem('user_payload', JSON.stringify(payload))
        setUser(payload)
      },
      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_payload')
        setUser(null)
      },
    }),
    [user, loading],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
