import { useEffect, useSyncExternalStore, useState, useRef } from 'react'
import { notificationStore, notify, type NotificationItem } from './notificationStore'

const TOAST_DURATION_MS = 5000

export const ToastContainer = () => {
  const notifications = useSyncExternalStore(
    (listener) => notificationStore.subscribe(listener),
    () => notificationStore.getNotifications(),
  )

  const [isPaused, setIsPaused] = useState(false)
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Handle auto-dismiss for non-error notifications
  useEffect(() => {
    // Clear old timers
    timersRef.current.forEach((t) => clearTimeout(t))
    timersRef.current.clear()

    if (isPaused) return

    notifications.forEach((item) => {
      // Never auto-dismiss errors
      if (item.type !== 'error') {
        const timer = setTimeout(() => {
          notify.dismiss(item.id)
        }, TOAST_DURATION_MS)
        timersRef.current.set(item.id, timer)
      }
    })

    return () => {
      timersRef.current.forEach((t) => clearTimeout(t))
      timersRef.current.clear()
    }
  }, [notifications, isPaused])

  const politeNotifications = notifications.filter((n) => n.type !== 'error')
  const assertiveNotifications = notifications.filter((n) => n.type === 'error')

  return (
    <div
      className="toast-container fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      aria-label="Notifications"
    >
      {/* Polite live region for info and success */}
      <div
        className="toast-live-region--polite pointer-events-auto flex flex-col gap-2"
        role="status"
        aria-live="polite"
        aria-atomic="false"
      >
        {politeNotifications.map((n) => (
          <ToastCard key={n.id} item={n} />
        ))}
      </div>

      {/* Assertive live region for errors */}
      <div
        className="toast-live-region--assertive pointer-events-auto flex flex-col gap-2"
        role="alert"
        aria-live="assertive"
        aria-atomic="false"
      >
        {assertiveNotifications.map((n) => (
          <ToastCard key={n.id} item={n} />
        ))}
      </div>
    </div>
  )
}

const ToastCard = ({ item }: { item: NotificationItem }) => {
  const typeStyles = {
    success: 'bg-green-900 border-green-700 text-green-100',
    error: 'bg-red-900 border-red-700 text-red-100',
    info: 'bg-zinc-800 border-zinc-700 text-zinc-100',
  }[item.type]

  return (
    <div
      className={`toast-item p-4 rounded-lg border shadow-lg flex items-start justify-between gap-3 transition-opacity duration-200 ${typeStyles}`}
      style={{
        transitionDuration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? '0ms' : '200ms',
      }}
    >
      <div className="toast-item__content flex-1 text-sm">
        <p className="font-medium">{item.message}</p>
        {item.detail ? <p className="text-xs mt-1 opacity-80">{item.detail}</p> : null}
      </div>
      <button
        type="button"
        onClick={() => notify.dismiss(item.id)}
        className="toast-item__close text-xs opacity-75 hover:opacity-100 px-1 py-0.5 rounded border border-transparent hover:border-current"
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  )
}
