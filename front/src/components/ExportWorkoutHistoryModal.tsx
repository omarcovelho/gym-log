import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { exportWorkoutHistory } from '@/api/workoutSession'
import { useToast } from './ToastProvider'

type Props = {
  open: boolean
  onClose: () => void
}

export function ExportWorkoutHistoryModal({ open, onClose }: Props) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [exportAll, setExportAll] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [dateError, setDateError] = useState('')

  if (!open) return null

  const handleExport = async () => {
    // Reset error
    setDateError('')

    // Validação: se ambas datas preenchidas, início <= fim
    if (!exportAll && startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (start > end) {
        setDateError(t('export.invalidDateRange'))
        return
      }
    }

    try {
      setExporting(true)

      // Converter datas para ISO string se preenchidas
      const startDateISO = exportAll || !startDate ? null : new Date(startDate).toISOString()
      const endDateISO = exportAll || !endDate ? null : new Date(endDate).toISOString()

      const data = await exportWorkoutHistory(startDateISO, endDateISO)

      // Criar arquivo JSON e fazer download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      // Nome do arquivo com data atual
      const today = new Date().toISOString().split('T')[0]
      link.download = `workout-history-${today}.json`
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        variant: 'success',
        title: t('export.exportSuccess'),
      })

      // Reset form e fechar modal
      setStartDate('')
      setEndDate('')
      setExportAll(false)
      onClose()
    } catch (error: any) {
      toast({
        variant: 'error',
        title: t('export.exportError'),
        description: error?.response?.data?.message || error?.message,
      })
    } finally {
      setExporting(false)
    }
  }

  const handleClose = () => {
    if (!exporting) {
      setStartDate('')
      setEndDate('')
      setExportAll(false)
      setDateError('')
      onClose()
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#181818] border border-gray-800 rounded-xl w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-gray-100">{t('export.title')}</h2>
          <button
            onClick={handleClose}
            disabled={exporting}
            className="text-gray-400 hover:text-gray-200 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Opção Exportar Tudo */}
          <div className="flex items-start gap-3 p-4 rounded-lg border border-gray-800 bg-[#0f0f0f]">
            <input
              type="checkbox"
              id="exportAll"
              checked={exportAll}
              onChange={(e) => {
                setExportAll(e.target.checked)
                if (e.target.checked) {
                  setStartDate('')
                  setEndDate('')
                  setDateError('')
                }
              }}
              disabled={exporting}
              className="mt-1 w-4 h-4 rounded border-gray-600 bg-[#0f0f0f] text-primary focus:ring-primary focus:ring-offset-0"
            />
            <div className="flex-1">
              <label htmlFor="exportAll" className="block text-sm font-medium text-gray-300 cursor-pointer">
                {t('export.exportAll')}
              </label>
              <p className="text-xs text-gray-500 mt-1">{t('export.exportAllDescription')}</p>
            </div>
          </div>

          {/* Campos de Data */}
          {!exportAll && (
            <div className="space-y-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-1">
                  {t('export.startDate')}
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    setDateError('')
                  }}
                  disabled={exporting}
                  className="w-full rounded-md border border-gray-700 bg-[#0f0f0f] px-3 py-2 text-base text-gray-100 focus:border-primary outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-1">
                  {t('export.endDate')}
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value)
                    setDateError('')
                  }}
                  disabled={exporting}
                  className="w-full rounded-md border border-gray-700 bg-[#0f0f0f] px-3 py-2 text-base text-gray-100 focus:border-primary outline-none disabled:opacity-50"
                />
              </div>

              {dateError && (
                <p className="text-sm text-red-400">{dateError}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-800">
          <button
            onClick={handleClose}
            disabled={exporting}
            className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || (!exportAll && !startDate && !endDate)}
            className="px-4 py-2 bg-primary text-black text-sm font-semibold rounded-md hover:brightness-110 transition disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {exporting ? t('common.exporting') : t('export.exportButton')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
