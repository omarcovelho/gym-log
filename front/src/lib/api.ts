import axios from 'axios'
import { isTokenExpiringSoon } from '@/utils/jwt'
import { persistAuthSession, refreshAccessToken } from '@/lib/refreshClient'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: unknown = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve()
    }
  })
  failedQueue = []
}

api.interceptors.request.use(async (config) => {
  const isRefreshRequest = config.url?.includes('/auth/refresh')
  if (isRefreshRequest) {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  }

  const token = localStorage.getItem('access_token')

  if (token) {
    if (isTokenExpiringSoon(token) && !isRefreshing) {
      isRefreshing = true
      try {
        const refreshed = await refreshAccessToken()
        persistAuthSession(refreshed)
        processQueue()
      } catch (error) {
        processQueue(error)
      } finally {
        isRefreshing = false
      }
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then(() => {
          const newToken = localStorage.getItem('access_token')
          if (newToken) {
            config.headers.Authorization = `Bearer ${newToken}`
          }
          return config
        })
        .catch((err) => Promise.reject(err))
    }

    const currentToken = localStorage.getItem('access_token')
    if (currentToken) {
      config.headers.Authorization = `Bearer ${currentToken}`
    }
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshed = await refreshAccessToken()
        persistAuthSession(refreshed)

        originalRequest.headers.Authorization = `Bearer ${refreshed.access_token}`
        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_payload')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      'An error occurred'

    return Promise.reject(new Error(message))
  },
)
