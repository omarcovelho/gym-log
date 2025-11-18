import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { X, Plus, Trash2, Edit2 } from 'lucide-react'
import {
  getRestTimers,
  createRestTimer,
  updateRestTimer,
  deleteRestTimer,
  type RestTimer,
} from '@/api/restTimer'
import { useToast } from './ToastProvider'
import { ConfirmDialog } from './ConfirmDialog'
import { Loader2 } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
}

export function RestTimerManager({ open, onClose }: Props) {
  const { toast } = useToast()
  const [timers, setTimers] = useState<RestTimer[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [minutes, setMinutes] = useState('')
  const [seconds, setSeconds] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      loadTimers()
    } else {
      // Reset form when closing
      setEditingId(null)
      setName('')
      setMinutes('')
      setSeconds('')
    }
  }, [open])

  async function loadTimers() {
    setLoading(true)
    try {
      const data = await getRestTimers()
      // Filter out default timers for management
      setTimers(data.filter((t) => !t.isDefault))
    } catch (err) {
      toast({
        variant: 'error',
        title: 'Failed to load timers',
        description: 'Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  function startEdit(timer: RestTimer) {
    setEditingId(timer.id)
    setName(timer.name)
    const mins = Math.floor(timer.seconds / 60)
    const secs = timer.seconds % 60
    setMinutes(mins.toString())
    setSeconds(secs.toString())
  }

  function cancelEdit() {
    setEditingId(null)
    setName('')
    setMinutes('')
    setSeconds('')
  }

  async function handleSave() {
    const mins = parseInt(minutes) || 0
    const secs = parseInt(seconds) || 0
    const totalSeconds = mins * 60 + secs

    if (totalSeconds < 10) {
      toast({
        variant: 'error',
        title: 'Invalid duration',
        description: 'Timer must be at least 10 seconds.',
      })
      return
    }

    if (totalSeconds > 1800) {
      toast({
        variant: 'error',
        title: 'Invalid duration',
        description: 'Timer cannot exceed 30 minutes.',
      })
      return
    }

    if (!name.trim()) {
      toast({
        variant: 'error',
        title: 'Name required',
        description: 'Please enter a timer name.',
      })
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        await updateRestTimer(editingId, name.trim(), totalSeconds)
        toast({
          variant: 'success',
          title: 'Timer updated',
          description: 'Your timer has been updated successfully.',
        })
      } else {
        await createRestTimer(name.trim(), totalSeconds)
        toast({
          variant: 'success',
          title: 'Timer created',
          description: 'Your new timer has been created successfully.',
        })
      }
      cancelEdit()
      loadTimers()
    } catch (err: any) {
      toast({
        variant: 'error',
        title: 'Failed to save timer',
        description: err?.message || 'Please try again.',
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return

    setSaving(true)
    try {
      await deleteRestTimer(deleteId)
      toast({
        variant: 'success',
        title: 'Timer deleted',
        description: 'Your timer has been deleted successfully.',
      })
      loadTimers()
    } catch (err: any) {
      toast({
        variant: 'error',
        title: 'Failed to delete timer',
        description: err?.message || 'Please try again.',
      })
    } finally {
      setSaving(false)
      setDeleteId(null)
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins === 0) return `${secs}s`
    if (secs === 0) return `${mins}min`
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!open) return null

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999]">
        <div className="bg-dark border border-gray-700 rounded-lg p-6 w-full max-w-md shadow-xl max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Manage Rest Timers</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="mb-4 p-4 rounded-lg border border-gray-700 bg-gray-900/50">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., 1:30, My Custom Timer"
                  className="w-full px-3 py-2 rounded border border-gray-600 bg-dark text-base text-gray-100 focus:outline-none focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Minutes
                  </label>
                  <input
                    type="number"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    placeholder="0"
                    min="0"
                    max="30"
                    className="w-full px-3 py-2 rounded border border-gray-600 bg-dark text-base text-gray-100 focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Seconds
                  </label>
                  <input
                    type="number"
                    value={seconds}
                    onChange={(e) => setSeconds(e.target.value)}
                    placeholder="0"
                    min="0"
                    max="59"
                    className="w-full px-3 py-2 rounded border border-gray-600 bg-dark text-base text-gray-100 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-4 py-2 rounded bg-primary text-black font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : editingId ? (
                    'Update Timer'
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Timer
                    </>
                  )}
                </button>
                {editingId && (
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-2 rounded border border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto mb-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : timers.length === 0 ? (
              <p className="text-center text-gray-400 py-8">
                No custom timers. Create one above!
              </p>
            ) : (
              <div className="space-y-2">
                {timers.map((timer) => (
                  <div
                    key={timer.id}
                    className="p-3 rounded-lg border border-gray-700 bg-gray-900/30"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-100">
                          {timer.name}
                        </div>
                        <div className="text-sm text-gray-400">
                          {formatTime(timer.seconds)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(timer)}
                          className="p-2 rounded text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(timer.id)}
                          className="p-2 rounded text-red-400 hover:text-red-300 hover:bg-red-900/20 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Timer"
        message="Are you sure you want to delete this timer? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>,
    document.body
  )
}

