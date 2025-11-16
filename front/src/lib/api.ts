import axios from 'axios'
import { refreshToken, isTokenExpiringSoon } from '@/api/auth'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: any) => void
  reject: (reason?: any) => void
}> = []

const processQueue = (error: any = null) => {
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
  const token = localStorage.getItem('access_token')
  
  if (token) {
    // Refresh token if expiring soon (before making request)
    if (isTokenExpiringSoon(token) && !isRefreshing) {
      isRefreshing = true
      try {
        const refreshed = await refreshToken()
        localStorage.setItem('access_token', refreshed.access_token)
        localStorage.setItem('user_payload', JSON.stringify({
          sub: refreshed.user.id,
          email: refreshed.user.email,
          name: refreshed.user.name,
        }))
        processQueue()
      } catch (error) {
        processQueue(error)
        // If refresh fails, continue with current token
      } finally {
        isRefreshing = false
      }
    }
    
    // Wait if refresh is in progress
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then(() => {
        const newToken = localStorage.getItem('access_token')
        if (newToken) {
          config.headers.Authorization = `Bearer ${newToken}`
        }
        return config
      }).catch((err) => {
        return Promise.reject(err)
      })
    }
    
    config.headers.Authorization = `Bearer ${token}`
  }
  
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      // Try to refresh token
      try {
        const refreshed = await refreshToken()
        localStorage.setItem('access_token', refreshed.access_token)
        localStorage.setItem('user_payload', JSON.stringify({
          sub: refreshed.user.id,
          email: refreshed.user.email,
          name: refreshed.user.name,
        }))

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${refreshed.access_token}`
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_payload')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }

    // Padroniza formato de erro
    const message =
      error.response?.data?.message ||
      error.message ||
      'An error occurred'

    return Promise.reject(new Error(message))
  },
)
