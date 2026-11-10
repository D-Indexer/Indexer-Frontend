import type { ReactNode } from 'react'
import { useWalletGuard } from '../hooks/useWalletGuard'

interface WalletGateProps {
  children: (address: string) => ReactNode
}

/** Renders children only when a testnet wallet is connected; otherwise explains what is missing. */
export const WalletGate = ({ children }: WalletGateProps) => {
  const { address, blockedReason } = useWalletGuard()
  if (blockedReason || !address) {
    return (
      <div className="notice notice--warning" role="status">
        <p>{blockedReason}</p>
      </div>
    )
  }
  return <>{children(address)}</>
}
