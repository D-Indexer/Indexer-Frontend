import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ActivityTx {
  address: string
  error?: string
  hash: string | null
  id: string
  method: string
  status: 'pending' | 'success' | 'failed'
  timestamp: number
}

interface ActivityStoreState {
  activities: Record<string, ActivityTx[]>
  addActivity: (item: Omit<ActivityTx, 'id' | 'timestamp'>) => string
  clearActivities: (address: string) => void
  getActivities: (address: string) => ActivityTx[]
  updateActivity: (id: string, address: string, updates: Partial<ActivityTx>) => void
}

const MAX_HISTORY_PER_ADDRESS = 20

export const useActivityStore = create<ActivityStoreState>()(
  persist(
    (set, get) => ({
      activities: {},

      addActivity: (item) => {
        const id = `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        const newEntry: ActivityTx = {
          ...item,
          id,
          timestamp: Date.now(),
        }

        set((state) => {
          const list = state.activities[item.address] ?? []
          const updated = [newEntry, ...list].slice(0, MAX_HISTORY_PER_ADDRESS)
          return {
            activities: {
              ...state.activities,
              [item.address]: updated,
            },
          }
        })

        return id
      },

      updateActivity: (id, address, updates) => {
        set((state) => {
          const list = state.activities[address] ?? []
          const updated = list.map((tx) => (tx.id === id ? { ...tx, ...updates } : tx))
          return {
            activities: {
              ...state.activities,
              [address]: updated,
            },
          }
        })
      },

      clearActivities: (address) => {
        set((state) => ({
          activities: {
            ...state.activities,
            [address]: [],
          },
        }))
      },

      getActivities: (address) => {
        return get().activities[address] ?? []
      },
    }),
    {
      name: 'folder-activity-history',
    },
  ),
)
