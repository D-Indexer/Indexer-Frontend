import { createStorageEntry } from './storage'

/** Whether the user asked to auto-reconnect their Freighter wallet. */
export const walletRememberedEntry = createStorageEntry<boolean>('wallet.connected', {
  version: 1,
  validate: (value): value is boolean => typeof value === 'boolean',
})
