import { api } from '@/lib/api'

export type User = {
  id: string
  email: string
  name?: string
  role?: string
}

export type AuthResponse = {
  access_token: string
  user: User
}

export type ValidateResponse = {
  user: User
}

/* ---------- Validate token ---------- */
export async function validateToken(): Promise<ValidateResponse> {
  const { data } = await api.get<ValidateResponse>('/auth/validate')
  return data
}

/* ---------- Refresh token ---------- */
export async function refreshToken(): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/refresh')
  return data
}

/* ---------- Check if token is expired or expiring soon ---------- */
export function isTokenExpiringSoon(token: string | null): boolean {
  if (!token) return true
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const exp = payload.exp * 1000 // Convert to milliseconds
    const now = Date.now()
    const timeUntilExpiry = exp - now
    const oneDayInMs = 24 * 60 * 60 * 1000
    
    // Consider expiring soon if less than 1 day remaining
    return timeUntilExpiry < oneDayInMs
  } catch {
    return true
  }
}

export function isTokenExpired(token: string | null): boolean {
  if (!token) return true
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const exp = payload.exp * 1000
    return Date.now() >= exp
  } catch {
    return true
  }
}

