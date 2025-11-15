import { createContext, useContext, useMemo, useState } from 'react'

type User = { sub: string; email: string; name?: string } | null
type AuthCtx = {
  user: User
  login: (token: string, payload: User) => void
  logout: () => void
}

const Ctx = createContext<AuthCtx>({} as any)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(() => {
    const token = localStorage.getItem('access_token')
    const payload = localStorage.getItem('user_payload')
    return token && payload ? JSON.parse(payload) : null
  })

  const value = useMemo<AuthCtx>(
    () => ({
      user,
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
    [user],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
