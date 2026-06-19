import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Tag } from 'lucide-react'
import { listTags } from '@/api/workoutTags'

export type ProgressGranularity = 'week' | 'session'

type Props = {
  selectedTagId: string | null
  onTagChange: (tagId: string | null) => void
  granularity: ProgressGranularity
  onGranularityChange: (granularity: ProgressGranularity) => void
}

export function ProgressTagFilter({
  selectedTagId,
  onTagChange,
  granularity,
  onGranularityChange,
}: Props) {
  const { t } = useTranslation()

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['workout-tags'],
    queryFn: listTags,
  })

  return (
    <div className="rounded-xl border border-gray-800 bg-[#101010] p-4 md:p-6 w-full sm:max-w-md space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Tag className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-base font-semibold text-gray-200">
          {t('progress.tagFilter', 'Block tag')}
        </h3>
      </div>

      <select
        value={selectedTagId ?? ''}
        onChange={(e) => onTagChange(e.target.value || null)}
        disabled={isLoading}
        className="w-full px-4 py-2 rounded-lg border border-gray-800 bg-[#151515] text-gray-200 text-sm font-medium focus:outline-none focus:border-primary transition disabled:opacity-50"
      >
        <option value="">{t('progress.allTags', 'All tags')}</option>
        {tags.map((tag) => (
          <option key={tag.id} value={tag.id}>
            {tag.name}
          </option>
        ))}
      </select>

      <div>
        <p className="text-xs text-gray-500 mb-2">{t('progress.granularity', 'Granularity')}</p>
        <div className="flex rounded-lg border border-gray-800 bg-[#151515] p-1">
          <button
            type="button"
            onClick={() => onGranularityChange('week')}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition ${
              granularity === 'week'
                ? 'bg-primary text-black'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {t('progress.byWeek', 'By week')}
          </button>
          <button
            type="button"
            onClick={() => onGranularityChange('session')}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition ${
              granularity === 'session'
                ? 'bg-primary text-black'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {t('progress.bySession', 'By session')}
          </button>
        </div>
      </div>
    </div>
  )
}
