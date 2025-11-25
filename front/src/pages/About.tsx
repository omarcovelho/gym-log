import { useTranslation } from 'react-i18next'
import { getBuildInfo } from '@/utils/buildInfo'
import { useEffect, useState } from 'react'

export default function About() {
  const { t, i18n } = useTranslation()
  const buildInfo = getBuildInfo()
  
  const formatBuildDate = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString(i18n.language === 'pt' ? 'pt-BR' : 'en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateString
    }
  }
  const [pwaStatus, setPwaStatus] = useState<{
    isInstalled: boolean
    isUpdateAvailable: boolean
  }>({
    isInstalled: false,
    isUpdateAvailable: false,
  })

  useEffect(() => {
    // Verificar se é PWA instalado
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isInstalled = isStandalone || (window.navigator as any).standalone === true

    // Verificar se há atualização disponível do service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          // Verificar se há uma nova versão esperando
          if (registration.waiting) {
            setPwaStatus({ isInstalled, isUpdateAvailable: true })
          }

          // Ouvir por atualizações
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Nova versão instalada e esperando
                  setPwaStatus({ isInstalled, isUpdateAvailable: true })
                }
              })
            }
          })

          // Verificar periodicamente por atualizações
          setInterval(() => {
            registration.update()
          }, 60000) // Verificar a cada minuto
        }
      })
    }

    setPwaStatus((prev) => ({ ...prev, isInstalled }))
  }, [])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">{t('about.title')}</h1>
      </header>

      <div className="space-y-6">
        {/* App Info */}
        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-primary">GymLog</h2>
          <p className="text-gray-400">{t('about.description')}</p>
        </div>

        {/* Build Info */}
        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">{t('about.buildInfo')}</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-gray-400">{t('about.version')}</span>
              <span className="font-mono text-sm">{buildInfo.version}</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-gray-400">{t('about.buildId')}</span>
              <span className="font-mono text-sm">{buildInfo.buildId}</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-gray-400">{t('about.buildDate')}</span>
              <span className="font-mono text-sm">
                {formatBuildDate(buildInfo.buildDate)}
              </span>
            </div>
          </div>
        </div>

        {/* PWA Status */}
        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">{t('about.pwaStatus')}</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-gray-400">{t('about.installationStatus')}</span>
              <span className={pwaStatus.isInstalled ? 'text-green-400' : 'text-gray-500'}>
                {pwaStatus.isInstalled ? t('about.installed') : t('about.notInstalled')}
              </span>
            </div>
            {pwaStatus.isUpdateAvailable && (
              <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3">
                <p className="text-yellow-400 text-sm">{t('about.updateAvailable')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

