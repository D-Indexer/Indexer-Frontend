export type NotificationType = 'success' | 'error' | 'info'

export interface NotificationItem {
  id: string
  message: string
  type: NotificationType
  detail?: string
  createdAt: number
}

type NotificationListener = () => void

class NotificationStore {
  private notifications: NotificationItem[] = []
  private listeners: Set<NotificationListener> = new Set()
  private counter = 0

  subscribe(listener: NotificationListener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getNotifications(): NotificationItem[] {
    return this.notifications
  }

  notify(message: string, type: NotificationType = 'info', detail?: string) {
    const trimmed = message.trim()
    if (!trimmed) return

    // Deduplicate identical messages currently visible
    const existing = this.notifications.find((n) => n.message === trimmed && n.type === type)
    if (existing) {
      return
    }

    const item: NotificationItem = {
      id: `toast-${Date.now()}-${++this.counter}`,
      message: trimmed,
      type,
      detail,
      createdAt: Date.now(),
    }

    // Keep max 3 visible notifications
    this.notifications = [...this.notifications, item].slice(-3)
    this.emit()
  }

  dismiss(id: string) {
    this.notifications = this.notifications.filter((n) => n.id !== id)
    this.emit()
  }

  clear() {
    this.notifications = []
    this.emit()
  }

  private emit() {
    this.listeners.forEach((listener) => listener())
  }
}

export const notificationStore = new NotificationStore()

export const notify = {
  success: (message: string, detail?: string) => notificationStore.notify(message, 'success', detail),
  error: (message: string, detail?: string) => notificationStore.notify(message, 'error', detail),
  info: (message: string, detail?: string) => notificationStore.notify(message, 'info', detail),
  dismiss: (id: string) => notificationStore.dismiss(id),
  clear: () => notificationStore.clear(),
}
