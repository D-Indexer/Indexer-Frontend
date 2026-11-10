import {
  getAddress,
  getNetworkDetails,
  isAllowed,
  isConnected,
  requestAccess,
  signTransaction,
  WatchWalletChanges,
} from '@stellar/freighter-api'

export interface WalletNetwork {
  network: string
  networkPassphrase: string
}

export interface WalletSnapshot extends WalletNetwork {
  address: string
}

export class WalletError extends Error {
  constructor(
    message: string,
    readonly code: 'not_installed' | 'rejected' | 'unknown' = 'unknown',
  ) {
    super(message)
    this.name = 'WalletError'
  }
}

const unwrap = <T extends { error?: { message: string } }>(result: T, fallback: string): T => {
  if (result.error) {
    const rejected = /declin|reject|denied/i.test(result.error.message)
    throw new WalletError(rejected ? 'The request was rejected in Freighter.' : result.error.message || fallback, rejected ? 'rejected' : 'unknown')
  }
  return result
}

/** Thin wrapper around @stellar/freighter-api that throws typed errors instead of returning `{ error }`. */
export const freighterWallet = {
  isInstalled: async () => {
    const result = await isConnected()
    return !result.error && result.isConnected
  },

  /** True when the user previously allowed this site, so the address can be read without a prompt. */
  isAllowed: async () => {
    const result = await isAllowed()
    return !result.error && result.isAllowed
  },

  connect: async (): Promise<WalletSnapshot> => {
    if (!(await freighterWallet.isInstalled())) {
      throw new WalletError('Freighter is not installed. Install it from freighter.app and reload the page.', 'not_installed')
    }
    const { address } = unwrap(await requestAccess(), 'Could not connect to Freighter.')
    if (!address) {
      throw new WalletError('Freighter did not share an address.', 'rejected')
    }
    return { address, ...(await freighterWallet.getNetwork()) }
  },

  /** Reads the current address without prompting; returns null when not allowed or locked. */
  restore: async (): Promise<WalletSnapshot | null> => {
    if (!(await freighterWallet.isInstalled()) || !(await freighterWallet.isAllowed())) {
      return null
    }
    const result = await getAddress()
    if (result.error || !result.address) {
      return null
    }
    return { address: result.address, ...(await freighterWallet.getNetwork()) }
  },

  getNetwork: async (): Promise<WalletNetwork> => {
    const { network, networkPassphrase } = unwrap(await getNetworkDetails(), 'Could not read the Freighter network.')
    return { network, networkPassphrase }
  },

  signTransaction: async (xdr: string, address: string, networkPassphrase: string): Promise<string> => {
    const { signedTxXdr } = unwrap(
      await signTransaction(xdr, { address, networkPassphrase }),
      'Freighter could not sign the transaction.',
    )
    return signedTxXdr
  },

  /** Polls Freighter for account/network switches. Returns a stop function. */
  watch: (onChange: (snapshot: WalletSnapshot) => void, intervalMs = 3000) => {
    const watcher = new WatchWalletChanges(intervalMs)
    watcher.watch(({ address, network, networkPassphrase, error }) => {
      if (!error) {
        onChange({ address, network, networkPassphrase })
      }
    })
    return () => watcher.stop()
  },
}
