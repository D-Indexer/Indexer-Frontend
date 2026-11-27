import type { ReactNode } from 'react'
import { useWalletGuard } from '../hooks/useWalletGuard'
import { useLocation } from 'react-router-dom'

interface WalletGateProps {
  children: (address: string) => ReactNode
}

/** Renders children only when a testnet wallet is connected; otherwise explains what is missing. */
export const WalletGate = ({ children }: WalletGateProps) => {
  const { address, blockedReason } = useWalletGuard()
  const location = useLocation()
  if (blockedReason || !address) {
    try { sessionStorage.setItem('wallet.returnTo', `${location.pathname}${location.search}${location.hash}`) } catch { /* optional */ }
    return (
      <div className="notice notice--warning" role="status">
        <p>{blockedReason}</p>
      </div>
    )
  }
  return <>{children(address)}</>
}
