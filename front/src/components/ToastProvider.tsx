import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'

type ToastVariant = 'success' | 'error' | 'info'

type Toast = {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

type ToastContextType = {
  toast: (t: Omit<Toast, 'id'>) => void
}

const ToastCtx = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = `t_${Date.now()}_${counter.current++}`
    const duration = t.duration ?? 3500
    const entry: Toast = { id, duration, ...t }
    setToasts(prev => [...prev, entry])

    // auto-dismiss
    setTimeout(() => {
      setToasts(prev => prev.filter(x => x.id !== id))
    }, duration)
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastCtx.Provider value={value}>
      {children}
      {createPortal(
        <div
          className="
            fixed z-[9999] flex flex-col gap-2 px-3
            sm:top-4 sm:right-4
            bottom-4 right-1/2 translate-x-1/2 sm:translate-x-0
            sm:left-auto sm:bottom-auto w-full sm:w-auto max-w-sm
          "
        >
          {toasts.map(t => (
            <ToastCard
              key={t.id}
              {...t}
              onClose={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
            />
          ))}
        </div>,
        document.body
      )}
    </ToastCtx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}

function ToastCard({
  title,
  description,
  variant = 'info',
  onClose,
}: Omit<Toast, 'id'> & { onClose: () => void }) {
  const style =
    variant === 'success'
      ? 'border-green-700 bg-green-900/30 text-green-200'
      : variant === 'error'
      ? 'border-red-700 bg-red-900/30 text-red-200'
      : 'border-blue-700 bg-blue-900/30 text-blue-200'

  return (
    <div
      className={`relative rounded-md border px-4 py-3 shadow-lg backdrop-blur-md animate-toast-in ${style}`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-lg">
          {variant === 'success'
            ? '✅'
            : variant === 'error'
            ? '⚠️'
            : 'ℹ️'}
        </span>
        <div className="flex-1">
          <div className="font-semibold">{title}</div>
          {description && (
            <div className="text-sm opacity-90">{description}</div>
          )}
        </div>
        <button
          onClick={onClose}
          className="ml-2 text-sm opacity-60 hover:opacity-100"
          aria-label="Close"
        >
          ✖
        </button>
      </div>
    </div>
  )
}
