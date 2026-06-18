import { api } from '@/lib/api'
import { refreshAccessToken } from '@/lib/refreshClient'
import { isTokenExpired, isTokenExpiringSoon } from '@/utils/jwt'

export { isTokenExpired, isTokenExpiringSoon }

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
  return refreshAccessToken()
}

/* ---------- Forgot password ---------- */
export async function forgotPassword(email: string): Promise<void> {
  await api.post('/auth/forgot-password', { email })
}

/* ---------- Reset password ---------- */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await api.post('/auth/reset-password', { token, newPassword })
}

/* ---------- Request signup (send confirmation email) ---------- */
export async function requestSignup(email: string): Promise<{ success: boolean; message: string }> {
  const { data } = await api.post<{ success: boolean; message: string }>('/auth/signup', { email })
  return data
}

/* ---------- Confirm signup (set password and create user) ---------- */
export async function confirmSignup(
  token: string,
  password: string,
  name?: string
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/confirm-signup', {
    token,
    password,
    name,
  })
  return data
}

