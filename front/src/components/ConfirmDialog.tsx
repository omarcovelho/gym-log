import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

type Props = {
  open: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useTranslation()
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999]">
      <div className="bg-dark border border-gray-700 rounded-lg p-5 w-full max-w-sm shadow-xl">
        {title && <h2 className="text-lg font-semibold mb-3">{title}</h2>}
        <p className="text-sm text-gray-300 mb-5">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded border border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            {cancelText || t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-semibold"
          >
            {confirmText || t('common.confirm')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
