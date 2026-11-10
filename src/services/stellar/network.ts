import { Networks } from '@stellar/stellar-sdk'

export const TESTNET_PASSPHRASE = Networks.TESTNET

export const getNetworkPassphrase = () => TESTNET_PASSPHRASE

export const isTestnetPassphrase = (passphrase: string | null | undefined) => passphrase === TESTNET_PASSPHRASE

const EXPLORER_BASE = 'https://stellar.expert/explorer/testnet'

export const explorerLinks = {
  account: (address: string) => `${EXPLORER_BASE}/account/${address}`,
  contract: (contractId: string) => `${EXPLORER_BASE}/contract/${contractId}`,
  transaction: (hash: string) => `${EXPLORER_BASE}/tx/${hash}`,
}

/** `GABC…WXYZ` style shortening for addresses and hashes. */
export const shortenKey = (value: string, visible = 4) =>
  value.length <= visible * 2 + 1 ? value : `${value.slice(0, visible)}…${value.slice(-visible)}`
