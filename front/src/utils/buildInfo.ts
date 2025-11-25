// Build information injected at build time by Vite
// These are defined in vite.config.ts

declare const __APP_VERSION__: string
declare const __BUILD_ID__: string
declare const __BUILD_DATE__: string

export interface BuildInfo {
  version: string
  buildId: string
  buildDate: string
}

export function getBuildInfo(): BuildInfo {
  return {
    version: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0',
    buildId: typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : 'unknown',
    buildDate: typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : new Date().toISOString(),
  }
}


