import type { WalletSnapshot } from './freighterWallet'
export type WalletSyncMessage = { type: 'connected' | 'changed'; snapshot: WalletSnapshot } | { type: 'disconnected' }
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('folder.wallet') : null
export const walletSync = { post: (message: WalletSyncMessage) => channel?.postMessage(message), listen: (apply: (message: WalletSyncMessage) => void) => { if (!channel) return () => undefined; channel.onmessage = (event) => apply(event.data as WalletSyncMessage); return () => { channel.onmessage = null } } }
