import { useEffect, useState, useRef } from 'react'
import { Play, Pause, Square, SkipForward, X } from 'lucide-react'
import {
  requestWakeLock,
  releaseWakeLock,
  sendNotification,
  vibrate,
  updateBadge,
  clearBadge,
  playTimerSound,
} from '@/utils/pwa'
import { getTimerSettings } from '@/utils/timerSettings'

type Props = {
  initialSeconds: number
  onComplete: () => void
  onStop: () => void
}

const TIMER_STORAGE_KEY = 'restTimerActive'

type TimerState = {
  startTime?: number
  initialSeconds: number
  pausedAt?: number
  elapsedBeforePause?: number
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function RestTimerCountdown({
  initialSeconds,
  onComplete,
  onStop,
}: Props) {
  const [remaining, setRemaining] = useState(initialSeconds)
  const [isPaused, setIsPaused] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const intervalRef = useRef<number | null>(null)
  const stateRef = useRef<TimerState>({
    startTime: Date.now(),
    initialSeconds,
  })
  const settings = getTimerSettings()

  // Load persisted timer state on mount
  useEffect(() => {
    const saved = localStorage.getItem(TIMER_STORAGE_KEY)
    if (saved) {
      try {
        const savedState: TimerState = JSON.parse(saved)
        const now = Date.now()
        const elapsed = savedState.pausedAt
          ? (savedState.elapsedBeforePause || 0)
          : savedState.startTime
          ? (now - savedState.startTime) / 1000
          : 0
        const remaining = Math.max(0, savedState.initialSeconds - elapsed)

        if (remaining > 0) {
          stateRef.current = {
            ...savedState,
            startTime: savedState.pausedAt ? undefined : (savedState.startTime || now),
            elapsedBeforePause: savedState.pausedAt
              ? savedState.elapsedBeforePause
              : undefined,
          }
          setRemaining(remaining)
          setIsPaused(!!savedState.pausedAt)
        } else {
          // Timer expired while app was closed
          localStorage.removeItem(TIMER_STORAGE_KEY)
          onComplete()
          return
        }
      } catch (err) {
        console.error('Failed to restore timer:', err)
        localStorage.removeItem(TIMER_STORAGE_KEY)
      }
    } else {
      // Initialize timer state for new timer
      stateRef.current = {
        startTime: Date.now(),
        initialSeconds,
      }
    }

    // Request wake lock
    requestWakeLock()

    // Request notification permission
    if (settings.notificationsEnabled && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }
  }, [])

  // Countdown logic
  useEffect(() => {
    if (!isActive || isPaused || remaining <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Calculate remaining time based on elapsed time
    const updateRemaining = () => {
      const now = Date.now()
      const elapsed =
        (stateRef.current.elapsedBeforePause || 0) +
        (stateRef.current.startTime ? (now - stateRef.current.startTime) / 1000 : 0)
      const newRemaining = Math.max(0, stateRef.current.initialSeconds - elapsed)

      setRemaining(newRemaining)

      // Update badge every 10 seconds or when remaining changes significantly
      const rounded = Math.ceil(newRemaining)
      if (rounded % 10 === 0 || rounded === 5 || rounded === 1 || rounded === 0) {
        updateBadge(rounded)
      }

      if (newRemaining === 0) {
        // Timer completed
        handleComplete()
      }
    }

    intervalRef.current = window.setInterval(updateRemaining, 100)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isActive, isPaused, remaining])

  // Save state to localStorage
  useEffect(() => {
    if (isActive && remaining > 0) {
      const state: TimerState = {
        ...(stateRef.current.startTime && { startTime: stateRef.current.startTime }),
        initialSeconds: stateRef.current.initialSeconds,
        ...(isPaused && {
          pausedAt: Date.now(),
          elapsedBeforePause: stateRef.current.elapsedBeforePause || 0,
        }),
      }
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state))
    } else {
      localStorage.removeItem(TIMER_STORAGE_KEY)
    }
  }, [isActive, isPaused, remaining])

  // Save state before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isActive && remaining > 0) {
        const state: TimerState = {
          startTime: stateRef.current.startTime,
          initialSeconds: stateRef.current.initialSeconds,
          ...(isPaused && {
            pausedAt: Date.now(),
            elapsedBeforePause: stateRef.current.elapsedBeforePause,
          }),
        }
        localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state))
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isActive, isPaused, remaining])

  function handleComplete() {
    setIsActive(false)
    clearBadge()
    releaseWakeLock()
    localStorage.removeItem(TIMER_STORAGE_KEY)

    // Trigger feedback
    if (settings.vibrationEnabled) {
      vibrate([200, 100, 200, 100, 200])
    }

    if (settings.soundEnabled) {
      playTimerSound()
    }

    if (settings.notificationsEnabled) {
      sendNotification('Rest Complete!', 'Time to get back to work!')
    }

    onComplete()
  }

  function handlePause() {
    if (isPaused) {
      // Resume
      stateRef.current = {
        startTime: Date.now(),
        initialSeconds: stateRef.current.initialSeconds,
        elapsedBeforePause: stateRef.current.elapsedBeforePause,
      }
      setIsPaused(false)
    } else {
      // Pause
      const now = Date.now()
      const elapsed =
        (stateRef.current.elapsedBeforePause || 0) +
        (stateRef.current.startTime ? (now - stateRef.current.startTime) / 1000 : 0)
      stateRef.current = {
        ...stateRef.current,
        pausedAt: now,
        elapsedBeforePause: elapsed,
      }
      delete stateRef.current.startTime
      setIsPaused(true)
    }
  }

  function handleStop() {
    setIsActive(false)
    clearBadge()
    releaseWakeLock()
    localStorage.removeItem(TIMER_STORAGE_KEY)
    onStop()
  }

  function handleSkip() {
    handleStop()
    onComplete()
  }

  if (!isActive) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-green-950/90 border-b-2 border-primary backdrop-blur-md">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-3xl font-bold text-primary tabular-nums">
            {formatTime(remaining)}
          </div>
          <div className="text-sm text-gray-300">
            {isPaused ? 'Paused' : 'Rest Timer'}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePause}
            className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 text-gray-300 hover:text-white transition"
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? (
              <Play className="w-5 h-5" />
            ) : (
              <Pause className="w-5 h-5" />
            )}
          </button>

          <button
            onClick={handleSkip}
            className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 text-gray-300 hover:text-white transition"
            title="Skip"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          <button
            onClick={handleStop}
            className="p-2 rounded-lg bg-gray-800/50 hover:bg-red-900/50 text-gray-300 hover:text-red-400 transition"
            title="Stop"
          >
            <Square className="w-5 h-5" />
          </button>

          <button
            onClick={handleStop}
            className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 text-gray-300 hover:text-white transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

