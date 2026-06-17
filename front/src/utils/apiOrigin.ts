/**
 * Origin of the Nest API (not the Vite dev server).
 * OAuth callback pages are served from here, so postMessage event.origin matches this.
 */
export function getApiOrigin(): string {
  const apiUrl = import.meta.env.VITE_API_URL || '/api'

  if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
    return new URL(apiUrl).origin
  }

  return import.meta.env.VITE_API_ORIGIN || 'http://localhost:3000'
}

export function getGoogleAuthUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL || '/api'

  if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
    return `${apiUrl}/auth/google`
  }

  return `${window.location.origin}${apiUrl}/auth/google`
}
