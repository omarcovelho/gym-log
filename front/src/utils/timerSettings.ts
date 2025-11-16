const SETTINGS_KEY = 'restTimerSettings'

export type TimerSettings = {
  notificationsEnabled: boolean
  vibrationEnabled: boolean
  soundEnabled: boolean
}

const DEFAULT_SETTINGS: TimerSettings = {
  notificationsEnabled: true,
  vibrationEnabled: true,
  soundEnabled: true,
}

export function getTimerSettings(): TimerSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
    }
  } catch (err) {
    console.error('Failed to load timer settings:', err)
  }
  return DEFAULT_SETTINGS
}

export function updateTimerSettings(
  settings: Partial<TimerSettings>,
): void {
  try {
    const current = getTimerSettings()
    const updated = { ...current, ...settings }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to save timer settings:', err)
  }
}

export function setNotificationsEnabled(enabled: boolean): void {
  updateTimerSettings({ notificationsEnabled: enabled })
}

export function setVibrationEnabled(enabled: boolean): void {
  updateTimerSettings({ vibrationEnabled: enabled })
}

export function setSoundEnabled(enabled: boolean): void {
  updateTimerSettings({ soundEnabled: enabled })
}

