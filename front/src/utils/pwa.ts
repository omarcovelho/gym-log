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

