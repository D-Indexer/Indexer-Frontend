import { env } from '@/config/env'
import { selectIsTestnet, useWalletStore } from '@/store'

export interface WalletGuard {
  address: string | null
  /** Why on-chain actions are blocked, or null when the wallet is ready. */
  blockedReason: string | null
  ready: boolean
}

/** Single source of truth for "can this user send a Folder transaction right now?". */
export const useWalletGuard = (): WalletGuard => {
  const address = useWalletStore((state) => state.address)
  const network = useWalletStore((state) => state.network)
  const status = useWalletStore((state) => state.status)
  const isTestnet = useWalletStore(selectIsTestnet)

  let blockedReason: string | null = null
  if (env.demoMode) {
    blockedReason = 'Demo mode is on, so on-chain actions are disabled. Unset VITE_DEMO_MODE to use testnet.'
  } else if (status !== 'connected' || !address) {
    blockedReason = 'Connect your Freighter wallet to continue.'
  } else if (!isTestnet) {
    blockedReason = `Your wallet is on ${network ?? 'another network'}. Switch Freighter to Testnet to continue.`
  }

  return { address, blockedReason, ready: blockedReason === null }
}
