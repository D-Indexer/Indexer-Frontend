import { useNetworkStatus } from '@/hooks/useNetworkStatus'

/** Persistent notice shown on every page while the browser is offline or the backend is unreachable. */
export const OfflineBanner = () => {
  const { browserOffline, backendUnreachable } = useNetworkStatus()
  if (!browserOffline && !backendUnreachable) return null

  return (
    <div className="offline-banner" role="status" aria-live="polite" aria-label="Connection status">
      <strong>{browserOffline ? 'You are offline.' : 'Backend unreachable.'}</strong>{' '}
      {browserOffline
        ? 'Reads will retry automatically when your connection returns, and on-chain actions are blocked.'
        : 'The Folder backend is not responding. Reads will retry automatically when it is reachable again.'}
    </div>
  )
}

/** Persistent notice shown on every page while VITE_DEMO_MODE=true. */
export const DemoBanner = () => (
  <div className="demo-banner" role="note" aria-label="Demo data">
    <strong>Demo data.</strong> VITE_DEMO_MODE is on: everything shown comes from bundled fixtures, not the Folder backend or
    Stellar testnet, and on-chain actions are disabled.
  </div>
)
