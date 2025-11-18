import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { X, Settings } from 'lucide-react'
import { getRestTimers, type RestTimer } from '@/api/restTimer'
import { Loader2 } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  onStart: (seconds: number) => void
  onManageClick: () => void
}

export function RestTimer({ open, onClose, onStart, onManageClick }: Props) {
  const [timers, setTimers] = useState<RestTimer[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadTimers()
    }
  }, [open])

  async function loadTimers() {
    setLoading(true)
    try {
      const data = await getRestTimers()
      setTimers(data)
    } catch (err) {
      console.error('Failed to load timers:', err)
    } finally {
      setLoading(false)
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  function handleSelect(timer: RestTimer) {
    onStart(timer.seconds)
    onClose()
  }

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999]">
      <div className="bg-dark border border-gray-700 rounded-lg p-6 w-full max-w-md shadow-xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Select Rest Timer</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto mb-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-2">
              {timers.map((timer) => (
                <button
                  key={timer.id}
                  onClick={() => handleSelect(timer)}
                  className="w-full text-left p-3 rounded-lg border border-gray-700 hover:border-primary hover:bg-gray-800/50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-100 text-lg">
                      {formatTime(timer.seconds)}
                    </div>
                    {timer.isDefault && (
                      <span className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-400">
                        Default
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => {
            onManageClick()
            onClose()
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition"
        >
          <Settings className="w-4 h-4" />
          Manage Timers
        </button>
      </div>
    </div>,
    document.body
  )
}

