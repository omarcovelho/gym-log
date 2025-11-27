export type DateRange = {
  startDate: string | null
  endDate: string | null
}

export const RANGE_PRESETS = {
  FOUR_WEEKS: '4weeks',
  EIGHT_WEEKS: '8weeks',
  TWELVE_WEEKS: '12weeks',
  SIXTEEN_WEEKS: '16weeks',
  THREE_MONTHS: '3months',
  SIX_MONTHS: '6months',
  ALL: 'all',
} as const

export type RangePreset = typeof RANGE_PRESETS[keyof typeof RANGE_PRESETS]

export function calculateDateRange(preset: RangePreset): DateRange {
  const now = new Date()
  now.setHours(23, 59, 59, 999) // Fim do dia atual

  switch (preset) {
    case '4weeks': {
      const startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 28) // 4 semanas = 28 dias
      startDate.setHours(0, 0, 0, 0)
      return {
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
      }
    }

    case '8weeks': {
      const startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 56) // 8 semanas = 56 dias
      startDate.setHours(0, 0, 0, 0)
      return {
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
      }
    }

    case '12weeks': {
      const startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 84) // 12 semanas = 84 dias
      startDate.setHours(0, 0, 0, 0)
      return {
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
      }
    }

    case '16weeks': {
      const startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 112) // 16 semanas = 112 dias
      startDate.setHours(0, 0, 0, 0)
      return {
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
      }
    }

    case '3months': {
      const startDate = new Date(now)
      startDate.setMonth(startDate.getMonth() - 3)
      startDate.setHours(0, 0, 0, 0)
      return {
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
      }
    }

    case '6months': {
      const startDate = new Date(now)
      startDate.setMonth(startDate.getMonth() - 6)
      startDate.setHours(0, 0, 0, 0)
      return {
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
      }
    }

    case 'all':
    default:
      return {
        startDate: null,
        endDate: null,
      }
  }
}

