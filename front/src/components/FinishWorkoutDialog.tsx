import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toDatetimeLocalValue } from '@/utils/datetimeLocal'
import {
  WorkoutTagPicker,
  emptyTagPickerValue,
  toSessionTagsPayload,
  type WorkoutTagPickerValue,
} from './WorkoutTagPicker'

export type FinishWorkoutData = {
  feeling?: 'GREAT' | 'GOOD' | 'OKAY' | 'BAD' | 'TERRIBLE'
  fatigue?: number
  notes?: string
  endAt?: string
  tagIds?: string[]
  newTagNames?: string[]
}

type Props = {
  open: boolean
  onClose: () => void
  onConfirm: (data: FinishWorkoutData) => Promise<void>
  initialTags: WorkoutTagPickerValue
}

const feelings = ['GREAT', 'GOOD', 'OKAY', 'BAD', 'TERRIBLE'] as const
const effortLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const

export function FinishWorkoutDialog({ open, onClose, onConfirm, initialTags }: Props) {
  const { t } = useTranslation()
  const [feeling, setFeeling] = useState<FinishWorkoutData['feeling']>()
  const [fatigue, setFatigue] = useState<number>(5)
  const [notes, setNotes] = useState('')
  const [endAt, setEndAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [tags, setTags] = useState<WorkoutTagPickerValue>(emptyTagPickerValue())

  useEffect(() => {
    if (open) {
      setEndAt(toDatetimeLocalValue(new Date()))
      setTags(initialTags)
    }
  }, [open, initialTags])

  if (!open) return null

  const handleConfirm = async () => {
    setLoading(true)
    await onConfirm({
      feeling,
      fatigue,
      notes,
      endAt: endAt ? new Date(endAt).toISOString() : undefined,
      ...toSessionTagsPayload(tags),
    })
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#181818] border border-gray-800 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-100 mb-4">{t('dialog.finishWorkout')}</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="finishedAt" className="block text-sm font-medium text-gray-300 mb-1">
              {t('dialog.finishedAt')}
            </label>
            <input
              id="finishedAt"
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className="w-full rounded-md border border-gray-700 bg-[#0f0f0f] px-3 py-2 text-base text-gray-100 focus:border-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {t('dialog.howWasWorkout')}
            </label>
            <div className="grid grid-cols-5 gap-2">
              {feelings.map((f) => (
                <button
                  key={f}
                  onClick={() => setFeeling(f)}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition border
                    ${
                      feeling === f
                        ? 'border-primary bg-primary/20 text-primary'
                        : 'border-gray-700 text-gray-400 hover:border-primary hover:text-primary'
                    }`}
                >
                  {t(`feelings.${f}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {t('dialog.fatigueLevel')}
            </label>
            <div className="grid grid-cols-10 gap-1">
              {effortLevels.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFatigue(level)}
                  className={`px-1 py-1 rounded-md text-xs font-medium transition border
                    ${
                      fatigue === level
                        ? 'border-primary bg-primary/20 text-primary'
                        : 'border-gray-700 text-gray-400 hover:border-primary hover:text-primary'
                    }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <WorkoutTagPicker value={tags} onChange={setTags} disabled={loading} />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{t('dialog.notes')}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('dialog.optionalNotes')}
              rows={3}
              className="w-full rounded-md border border-gray-700 bg-[#0f0f0f] px-3 py-2 text-base text-gray-100 focus:border-primary outline-none resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 bg-primary text-black text-sm font-semibold rounded-md hover:brightness-110 transition disabled:opacity-70"
          >
            {loading ? t('common.saving') : t('dialog.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
