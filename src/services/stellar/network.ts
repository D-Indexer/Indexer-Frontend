import { Networks } from '@stellar/stellar-sdk'
import { env } from '@/config/env'
import { explorerProviders, NoneExplorer, type ExplorerProvider } from './explorers'

export const TESTNET_PASSPHRASE = Networks.TESTNET

export const getNetworkPassphrase = () => TESTNET_PASSPHRASE

export const isTestnetPassphrase = (passphrase: string | null | undefined) => passphrase === TESTNET_PASSPHRASE

export const getActiveExplorer = (): ExplorerProvider => {
  const selected = env.explorer || 'stellar.expert'
  return explorerProviders[selected] ?? explorerProviders['stellar.expert']
}

export const explorerLinks = {
  account: (address: string) => getActiveExplorer().account(address, env.stellarNetwork) ?? '',
  contract: (contractId: string) => getActiveExplorer().contract(contractId, env.stellarNetwork) ?? '',
  transaction: (hash: string) => getActiveExplorer().transaction(hash, env.stellarNetwork) ?? '',
  hasExplorer: () => !(getActiveExplorer() instanceof NoneExplorer),
}

/** `GABC…WXYZ` style shortening for addresses and hashes. */
export const shortenKey = (value: string, visible = 4) =>
  value.length <= visible * 2 + 1 ? value : `${value.slice(0, visible)}…${value.slice(-visible)}`
