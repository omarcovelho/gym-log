import axios from 'axios'

export type RefreshUser = {
  id: string
  email: string
  name?: string
  role?: string
}

export type RefreshResponse = {
  access_token: string
  user: RefreshUser
}

const bareApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
})

export async function refreshAccessToken(): Promise<RefreshResponse> {
  const token = localStorage.getItem('access_token')
  const { data } = await bareApi.post<RefreshResponse>(
    '/auth/refresh',
    {},
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  )
  return data
}

export function persistAuthSession(refreshed: RefreshResponse): void {
  localStorage.setItem('access_token', refreshed.access_token)
  localStorage.setItem(
    'user_payload',
    JSON.stringify({
      sub: refreshed.user.id,
      email: refreshed.user.email,
      name: refreshed.user.name,
      role: refreshed.user.role,
    }),
  )
}
