import { create } from 'zustand'
import { freighterWallet, type WalletSnapshot } from '@/services/stellar/freighterWallet'
import { isTestnetPassphrase } from '@/services/stellar/network'

const REMEMBER_KEY = 'folder.wallet.connected'

const remember = (value: boolean) => {
  try {
    if (value) localStorage.setItem(REMEMBER_KEY, '1')
    else localStorage.removeItem(REMEMBER_KEY)
  } catch {
    // Storage can be unavailable (private mode); reconnecting just needs a click then.
  }
}

const isRemembered = () => {
  try {
    return localStorage.getItem(REMEMBER_KEY) === '1'
  } catch {
    return false
  }
}

export type WalletStatus = 'idle' | 'connecting' | 'connected'

interface WalletState {
  address: string | null
  error: string | null
  network: string | null
  networkPassphrase: string | null
  status: WalletStatus
  connect: () => Promise<void>
  disconnect: () => void
  restore: () => Promise<void>
  update: (snapshot: WalletSnapshot) => void
}

const emptyWallet = { address: null, network: null, networkPassphrase: null }

export const useWalletStore = create<WalletState>((set) => ({
  ...emptyWallet,
  error: null,
  status: 'idle',

  connect: async () => {
    set({ status: 'connecting', error: null })
    try {
      const snapshot = await freighterWallet.connect()
      remember(true)
      set({ ...snapshot, status: 'connected', error: null })
    } catch (error) {
      set({ ...emptyWallet, status: 'idle', error: error instanceof Error ? error.message : 'Could not connect the wallet.' })
    }
  },

  /** Freighter has no revoke API, so this forgets the address in-app and stops auto-reconnecting. */
  disconnect: () => {
    remember(false)
    set({ ...emptyWallet, status: 'idle', error: null })
  },

  restore: async () => {
    if (!isRemembered()) return
    try {
      const snapshot = await freighterWallet.restore()
      if (snapshot) set({ ...snapshot, status: 'connected', error: null })
    } catch {
      // Silent: the user can still connect manually.
    }
  },

  update: (snapshot) => set({ ...snapshot }),
}))

export const selectIsTestnet = (state: Pick<WalletState, 'networkPassphrase'>) =>
  isTestnetPassphrase(state.networkPassphrase)
