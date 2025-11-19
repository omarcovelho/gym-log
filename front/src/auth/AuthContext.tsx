import { createContext, useContext, useMemo, useState, useEffect } from 'react'
import { validateToken, refreshToken, isTokenExpiringSoon, isTokenExpired } from '@/api/auth'

export type User = { sub: string; email: string; name?: string; height?: number; weight?: number; role?: string } | null
type AuthCtx = {
  user: User
  loading: boolean
  login: (token: string, payload: User) => void
  logout: () => void
}

const Ctx = createContext<AuthCtx>({} as any)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [loading, setLoading] = useState(true)

  // Initialize and validate token on mount
  useEffect(() => {
    async function initializeAuth() {
      const token = localStorage.getItem('access_token')
      const payload = localStorage.getItem('user_payload')

      if (!token || !payload) {
        setLoading(false)
        return
      }

      // Check if token is expired
      if (isTokenExpired(token)) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_payload')
        setLoading(false)
        return
      }

      try {
        // Try to validate token with backend
        const response = await validateToken()
        const parsedPayload = JSON.parse(payload)
        
        // Update user info from backend
        setUser({
          sub: response.user.id,
          email: response.user.email,
          name: response.user.name || parsedPayload.name,
          role: response.user.role || parsedPayload.role,
        })

        // Refresh token if expiring soon
        if (isTokenExpiringSoon(token)) {
          try {
            const refreshed = await refreshToken()
            localStorage.setItem('access_token', refreshed.access_token)
            localStorage.setItem('user_payload', JSON.stringify({
              sub: refreshed.user.id,
              email: refreshed.user.email,
              name: refreshed.user.name,
              role: refreshed.user.role,
            }))
          } catch (err) {
            // If refresh fails, continue with current token
            console.warn('Failed to refresh token:', err)
          }
        }
      } catch (error) {
        // Token is invalid, clear it
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
