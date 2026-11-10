import { useEffect } from 'react'
import { Button } from '@/components/ui'
import { env } from '@/config/env'
import { explorerLinks, freighterWallet, shortenKey } from '@/services'
import { selectIsTestnet, useWalletStore } from '@/store'

export const WalletButton = () => {
  const { address, connect, disconnect, error, network, restore, status, update } = useWalletStore()
  const isTestnet = useWalletStore(selectIsTestnet)

  useEffect(() => {
    if (!env.demoMode) void restore()
  }, [restore])

  useEffect(() => {
    if (status !== 'connected') return undefined
    return freighterWallet.watch(update)
  }, [status, update])

  if (env.demoMode) {
    return null
  }

  if (status === 'connected' && address) {
    return (
      <div className="wallet" aria-label="Connected wallet">
        <span className={isTestnet ? 'wallet__network' : 'wallet__network wallet__network--wrong'}>
          {isTestnet ? 'Testnet' : `${network ?? 'Unknown'} (switch to Testnet)`}
        </span>
        <a className="wallet__address mono" href={explorerLinks.account(address)} target="_blank" rel="noreferrer" title={address}>
          {shortenKey(address)}
          <span className="sr-only"> (full address {address}, opens stellar.expert)</span>
        </a>
        <Button type="button" variant="secondary" onClick={disconnect}>
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <div className="wallet">
      <Button type="button" onClick={() => void connect()} disabled={status === 'connecting'} aria-describedby={error ? 'wallet-error' : undefined}>
        {status === 'connecting' ? 'Connecting…' : 'Connect Freighter'}
      </Button>
      {error ? (
        <p id="wallet-error" className="wallet__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
