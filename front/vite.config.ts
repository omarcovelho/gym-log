import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'

// Função para obter commit hash do Git
function getGitCommitHash(): string {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()
  } catch {
    return 'unknown'
  }
}

// Função para obter data do build
function getBuildDate(): string {
  return new Date().toISOString()
}

// Função para obter versão do package.json
function getPackageVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'))
    return pkg.version || '0.0.0'
  } catch {
    return '0.0.0'
  }
}

// Gerar build info
const buildInfo = {
  version: getPackageVersion(),
  buildId: getGitCommitHash(),
  buildDate: getBuildDate(),
}

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192x192.png', 'icon-512x512.png'],
      manifest: {
        name: 'GymLog',
        short_name: 'GymLog',
        description: 'Track your workouts and progress',
        theme_color: '#000000',
        background_color: '#0f0f0f',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    proxy: { '/api': { target: 'http://localhost:3000', changeOrigin: true } }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(buildInfo.version),
    __BUILD_ID__: JSON.stringify(buildInfo.buildId),
    __BUILD_DATE__: JSON.stringify(buildInfo.buildDate),
  },
})
