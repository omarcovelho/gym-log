export function decodeJwtPayload<T extends Record<string, unknown> = Record<string, unknown>>(
  token: string,
): T | null {
  try {
    const segment = token.split('.')[1]
    if (!segment) return null

    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    return JSON.parse(atob(padded)) as T
  } catch {
    return null
  }
}

export function isTokenExpiringSoon(token: string | null): boolean {
  if (!token) return true

  const payload = decodeJwtPayload<{ exp?: number }>(token)
  if (!payload?.exp) return true

  const timeUntilExpiry = payload.exp * 1000 - Date.now()
  const oneDayInMs = 24 * 60 * 60 * 1000

  return timeUntilExpiry < oneDayInMs
}

export function isTokenExpired(token: string | null): boolean {
  if (!token) return true

  const payload = decodeJwtPayload<{ exp?: number }>(token)
  if (!payload?.exp) return true

  return Date.now() >= payload.exp * 1000
}
