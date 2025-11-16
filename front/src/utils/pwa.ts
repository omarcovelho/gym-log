// Screen Wake Lock
let wakeLock: WakeLockSentinel | null = null

export async function requestWakeLock(): Promise<boolean> {
  if (!('wakeLock' in navigator)) {
    console.warn('Wake Lock API not supported')
    return false
  }

  try {
    wakeLock = await navigator.wakeLock.request('screen')
    console.log('Wake Lock activated')

    // Handle when wake lock is released (e.g., user switches tabs)
    wakeLock.addEventListener('release', () => {
      console.log('Wake Lock released')
    })

    return true
  } catch (err: any) {
    console.warn('Wake Lock request failed:', err.message)
    return false
  }
}

export function releaseWakeLock(): void {
  if (wakeLock) {
    wakeLock.release().then(() => {
      wakeLock = null
      console.log('Wake Lock released manually')
    })
  }
}

// Browser Notifications
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported')
    return 'denied'
  }

  if (Notification.permission === 'default') {
    return await Notification.requestPermission()
  }

  return Notification.permission
}

export async function sendNotification(
  title: string,
  body: string,
): Promise<void> {
  if (!('Notification' in window)) {
    return
  }

  const permission = await requestNotificationPermission()

  if (permission !== 'granted') {
    console.warn('Notification permission not granted')
    return
  }

  try {
    // Try to use Service Worker notification if available (works when app is closed)
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      if (registration && 'showNotification' in registration) {
        await registration.showNotification(title, {
          body,
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: 'rest-timer',
          requireInteraction: false,
          silent: false,
        })
        return
      }
    }

    // Fallback to regular Notification API
    const notification = new Notification(title, {
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'rest-timer', // Replace previous notifications with same tag
    })

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close()
    }, 5000)

    // Close on click
    notification.onclick = () => {
      window.focus()
      notification.close()
    }
  } catch (err) {
    console.error('Failed to send notification:', err)
  }
}

// Schedule notification for a specific time (uses setTimeout)
export function scheduleNotification(
  endTime: number,
  title: string,
  body: string,
): number | null {
  if (!('Notification' in window)) {
    return null
  }

  const now = Date.now()
  const delay = endTime - now

  if (delay <= 0) {
    // Timer already ended, send immediately
    sendNotification(title, body)
    return null
  }

  const timeoutId = window.setTimeout(() => {
    sendNotification(title, body)
    // Clear scheduled time from localStorage when notification fires
    localStorage.removeItem('restTimerNotificationScheduled')
  }, delay)

  // Save scheduled time for verification on app open
  localStorage.setItem(
    'restTimerNotificationScheduled',
    JSON.stringify({ endTime, timeoutId }),
  )

  return timeoutId
}

// Check if there's a scheduled notification that should have fired and fire it
export async function checkScheduledNotification(): Promise<void> {
  if (!('Notification' in window)) {
    return
  }

  const saved = localStorage.getItem('restTimerNotificationScheduled')
  if (!saved) {
    return
  }

  try {
    const { endTime } = JSON.parse(saved)
    const now = Date.now()

    // If the scheduled time has passed, fire the notification
    if (now >= endTime) {
      await sendNotification('Rest Complete!', 'Time to get back to work!')
      localStorage.removeItem('restTimerNotificationScheduled')
    }
  } catch (err) {
    console.error('Failed to check scheduled notification:', err)
    localStorage.removeItem('restTimerNotificationScheduled')
  }
}

// Clear scheduled notification
export function clearScheduledNotification(): void {
  const saved = localStorage.getItem('restTimerNotificationScheduled')
  if (saved) {
    try {
      const { timeoutId } = JSON.parse(saved)
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    } catch (err) {
      console.error('Failed to clear scheduled notification:', err)
    }
    localStorage.removeItem('restTimerNotificationScheduled')
  }
}

// Vibration API
export function vibrate(pattern: number | number[]): void {
  if (!('vibrate' in navigator)) {
    console.warn('Vibration API not supported')
    return
  }

  try {
    navigator.vibrate(pattern)
  } catch (err) {
    console.error('Vibration failed:', err)
  }
}

// Badge API
export async function updateBadge(count: number): Promise<void> {
  if (!('setAppBadge' in navigator)) {
    // Badge API not supported, silently fail
    return
  }

  try {
    await navigator.setAppBadge(count)
  } catch (err) {
    console.error('Failed to update badge:', err)
  }
}

export async function clearBadge(): Promise<void> {
  if (!('clearAppBadge' in navigator)) {
    return
  }

  try {
    await navigator.clearAppBadge()
  } catch (err) {
    console.error('Failed to clear badge:', err)
  }
}

// Web Audio API
export function playTimerSound(): void {
  try {
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800 // Hz
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.2)
  } catch (err) {
    console.error('Failed to play sound:', err)
  }
}

